import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { formatCurrency, maskCep, maskCpf, maskPhone, onlyDigits, roundCents } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { useCart, type Cart } from "@/hooks/useCart";
import { useAddressLookup, useShippingQuote } from "@/hooks/useShippingQuote";
import { saveOrderSnapshot } from "@/hooks/useOrderSnapshot";
import type {
  CheckoutErrors,
  CheckoutField,
  CheckoutForm,
  CheckoutStep,
  DeliveryMethod,
  PaymentMethod,
} from "@/types/checkout";

export const MAX_INSTALLMENTS = 6;

/** Ordem visual dos campos: o foco vai para o primeiro inválido nesta ordem. */
export const CHECKOUT_FIELD_ORDER: CheckoutField[] = [
  "nome",
  "email",
  "cpf",
  "telefone",
  "cep",
  "rua",
  "numero",
  "complemento",
  "bairro",
  "cidade",
  "estado",
];

const SUBMIT_ERROR_MESSAGE = "Não foi possível concluir o pedido. Tente novamente.";

export function validateContact(form: CheckoutForm): CheckoutErrors {
  const errors: CheckoutErrors = {};

  if (!form.nome.trim()) errors.nome = "Informe seu nome completo.";

  if (!form.email.trim()) errors.email = "Informe seu e-mail.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errors.email = "E-mail inválido.";

  const cpf = onlyDigits(form.cpf);
  if (!cpf) errors.cpf = "Informe seu CPF.";
  else if (cpf.length !== 11) errors.cpf = "O CPF deve ter 11 dígitos.";

  if (onlyDigits(form.telefone).length < 10) errors.telefone = "Informe um telefone com DDD.";

  return errors;
}

export function validateDelivery(
  form: CheckoutForm,
  delivery: DeliveryMethod,
  hasShippingQuote: boolean,
): CheckoutErrors {
  if (delivery === "loja") return {};

  const errors: CheckoutErrors = {};
  if (onlyDigits(form.cep).length !== 8) errors.cep = "CEP inválido. Use 8 dígitos.";
  else if (!hasShippingQuote) errors.cep = "Não foi possível calcular o frete para este CEP.";
  if (!form.rua.trim()) errors.rua = "Informe o endereço.";
  if (!form.numero.trim()) errors.numero = "Informe o número.";
  if (!form.bairro.trim()) errors.bairro = "Informe o bairro.";
  if (!form.cidade.trim()) errors.cidade = "Informe a cidade.";
  if (!/^[A-Za-z]{2}$/.test(form.estado.trim())) errors.estado = "Informe a UF.";
  return errors;
}

export function validateCheckoutForm(
  form: CheckoutForm,
  delivery: DeliveryMethod,
  { hasShippingQuote }: { hasShippingQuote: boolean },
): CheckoutErrors {
  return { ...validateContact(form), ...validateDelivery(form, delivery, hasShippingQuote) };
}

export function getFirstInvalidField(errors: CheckoutErrors): CheckoutField | null {
  return CHECKOUT_FIELD_ORDER.find((field) => errors[field]) ?? null;
}

/** Etapa ativa do stepper: a primeira seção ainda incompleta. */
export function getCurrentStep(
  form: CheckoutForm,
  delivery: DeliveryMethod,
  hasShippingQuote: boolean,
): CheckoutStep {
  if (Object.keys(validateContact(form)).length > 0) return "dados";
  if (Object.keys(validateDelivery(form, delivery, hasShippingQuote)).length > 0) return "entrega";
  return "pagamento";
}

export function buildInstallmentOptions(total: number, max: number = MAX_INSTALLMENTS) {
  return Array.from({ length: max }, (_, index) => {
    const value = index + 1;
    return { value, label: `${value}x de ${formatCurrency(total / value)} sem juros` };
  });
}

export function buildOrderPayload({
  form,
  cart,
  delivery,
  frete,
  isGuest,
}: {
  form: CheckoutForm;
  cart: Pick<Cart, "items" | "cupom">;
  delivery: DeliveryMethod;
  frete: number;
  isGuest: boolean;
}): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    items: cart.items.map((item) => ({
      variantSku: item.variant.codigoSku,
      quantidade: item.quantity,
    })),
    couponNumero: cart.cupom ?? null,
    valorFrete: delivery === "loja" ? 0 : frete,
    tipoRetirada: delivery,
  };

  if (delivery === "entrega") {
    Object.assign(payload, {
      enderecoCep: onlyDigits(form.cep),
      enderecoRua: form.rua.trim(),
      enderecoNumero: form.numero.trim(),
      enderecoComplemento: form.complemento.trim() || null,
      enderecoBairro: form.bairro.trim(),
      enderecoCidade: form.cidade.trim(),
      enderecoEstado: form.estado.trim().toUpperCase().slice(0, 2),
    });
  }

  if (isGuest) {
    Object.assign(payload, {
      clienteCpfAvulso: onlyDigits(form.cpf),
      clienteEmailAvulso: form.email.trim(),
      clienteNomeAvulso: form.nome.trim() || null,
      clienteTelefone: form.telefone.trim() || null,
    });
  }

  return payload;
}

const EMPTY_FORM: CheckoutForm = {
  nome: "",
  email: "",
  cpf: "",
  telefone: "",
  cep: "",
  rua: "",
  numero: "",
  complemento: "",
  bairro: "",
  cidade: "",
  estado: "",
};

/**
 * Estado e envio do checkout em página única: dados de contato, entrega,
 * pagamento e criação do pedido + pagamento (checkout hospedado InfinitePay).
 */
export function useCheckout() {
  const { cart, itemCount, clear, setShipping } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const shipping = useShippingQuote();
  const address = useAddressLookup();

  const [form, setForm] = useState<CheckoutForm>(() => ({
    ...EMPTY_FORM,
    nome: user?.name ?? "",
    email: user?.email ?? "",
    // No login real o id do usuário é o CPF (sub do JWT); outros formatos ficam de fora.
    cpf: onlyDigits(user?.id ?? "").length === 11 ? maskCpf(user?.id ?? "") : "",
    telefone: maskPhone(user?.phone ?? ""),
    cep: maskCep(cart.cep ?? ""),
  }));
  const [errors, setErrors] = useState<CheckoutErrors>({});
  const [delivery, setDelivery] = useState<DeliveryMethod>("entrega");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("credit_card");
  const [installments, setInstallments] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  /** Verdadeiro depois do envio: o carrinho esvazia, mas a página não deve voltar ao carrinho. */
  const [completed, setCompleted] = useState(false);
  const orderIdRef = useRef<number | null>(null);

  const { calculate, reset } = shipping;
  const { lookup } = address;

  // Recalcula o frete e completa o endereço quando o CEP fica completo.
  useEffect(() => {
    const cleanCep = onlyDigits(form.cep);
    if (cleanCep.length !== 8) {
      reset();
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      const [quote, found] = await Promise.all([calculate(cleanCep), lookup(cleanCep)]);
      if (cancelled) return;
      if (quote) setShipping({ cep: cleanCep, valor: quote.valor, prazoDias: quote.prazo_dias });
      if (found) {
        setForm((prev) => ({
          ...prev,
          rua: prev.rua || found.rua,
          bairro: prev.bairro || found.bairro,
          cidade: prev.cidade || found.cidade,
          estado: prev.estado || found.estado,
        }));
      }
    }, 400);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [form.cep, calculate, lookup, reset, setShipping]);

  const setField = useCallback((field: CheckoutField, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  const frete = delivery === "loja" ? 0 : (shipping.quote?.valor ?? null);
  const total = roundCents(Math.max(0, cart.subtotal - cart.desconto + (frete ?? 0)));
  const isGuest = !user;
  const currentStep = getCurrentStep(form, delivery, Boolean(shipping.quote));

  /** Valida e envia. Retorna os erros encontrados (vazio quando o envio seguiu). */
  const submit = useCallback(async (): Promise<CheckoutErrors> => {
    const validation = validateCheckoutForm(form, delivery, {
      hasShippingQuote: Boolean(shipping.quote),
    });
    if (delivery === "entrega" && shipping.error && validation.cep) validation.cep = shipping.error;
    setErrors(validation);
    if (Object.keys(validation).length > 0) return validation;
    if (paymentMethod === "boleto") return {};

    setSubmitting(true);
    setSubmitError(null);

    const valorFrete = delivery === "loja" ? 0 : (shipping.quote?.valor ?? 0);
    const parcelas = paymentMethod === "credit_card" ? installments : 1;

    try {
      let orderId = orderIdRef.current;
      if (orderId == null) {
        const payload = buildOrderPayload({ form, cart, delivery, frete: valorFrete, isGuest });
        const response = await api.post<{ idPedido: number }>(
          isGuest ? "/orders/guest" : "/orders",
          payload,
        );
        orderId = response.idPedido;
        // Numa nova tentativa reaproveita o pedido em vez de criar outro.
        orderIdRef.current = orderId;
      }

      const payment = await api.post<{ status: string; redirectUrl?: string | null }>(
        isGuest ? "/payments/guest" : "/payments",
        { idPedido: orderId, captureMethod: paymentMethod, installments: parcelas },
      );

      saveOrderSnapshot({
        idPedido: orderId,
        nome: form.nome.trim(),
        email: form.email.trim(),
        itemCount,
        subtotal: cart.subtotal,
        frete: valorFrete,
        desconto: cart.desconto,
        total: roundCents(Math.max(0, cart.subtotal - cart.desconto + valorFrete)),
        tipoRetirada: delivery,
        metodoPagamento: paymentMethod,
        parcelas,
        criadoEm: new Date().toISOString(),
      });
      setCompleted(true);
      clear();

      if (payment.status !== "paid" && payment.redirectUrl) {
        window.location.assign(payment.redirectUrl);
      } else {
        navigate(`/pedido/${orderId}`);
      }
      return {};
    } catch (err) {
      const message = err instanceof Error && err.message ? err.message : SUBMIT_ERROR_MESSAGE;
      setSubmitError(message);
      toast.error(message);
      setSubmitting(false);
      return {};
    }
  }, [
    form,
    delivery,
    shipping.quote,
    shipping.error,
    paymentMethod,
    installments,
    cart,
    itemCount,
    isGuest,
    clear,
    navigate,
  ]);

  return {
    form,
    setField,
    errors,
    delivery,
    setDelivery,
    paymentMethod,
    setPaymentMethod,
    installments,
    setInstallments,
    shipping,
    addressError: address.error,
    summary: {
      itemCount,
      subtotal: cart.subtotal,
      desconto: cart.desconto,
      frete,
      total,
    },
    currentStep,
    submit,
    submitting,
    submitError,
    completed,
    isGuest,
  };
}
