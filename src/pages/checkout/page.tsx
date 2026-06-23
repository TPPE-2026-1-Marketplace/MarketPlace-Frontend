
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Check,
  CreditCard,
  QrCode,
  ChevronRight,
  AlertCircle,
  User,
  ShoppingBag,
} from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/context/AuthContext";
import { formatCurrency } from "@/lib/utils";
import { api } from "@/lib/api";

type Step = "dados" | "entrega" | "pagamento" | "confirmado";

type ShippingQuote = {
  valor: number;
  prazo_dias: number;
};

function GuestCheckoutModal({
  onContinueAsGuest,
  onLogin,
}: {
  onContinueAsGuest: () => void;
  onLogin: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="bg-white max-w-sm w-full p-7 border border-gray-100">
        <div className="w-12 h-12 bg-gray-100 flex items-center justify-center mx-auto mb-4">
          <ShoppingBag className="w-6 h-6 text-gray-600" />
        </div>
        <h3 className="text-gray-900 text-center mb-2 font-serif text-xl">Finalizar compra</h3>
        <p className="text-gray-500 text-sm text-center leading-relaxed mb-1 font-sans">
          Você pode continuar preenchendo os dados, mas para concluir o pedido será
          necessário entrar no sistema.
        </p>
        <p className="text-gray-400 text-xs text-center mb-6 font-sans">
          Pedidos reais são registrados apenas para usuários autenticados.
        </p>

        <div className="space-y-3 font-sans">
          <button
            onClick={onContinueAsGuest}
            className="bt-principal w-full py-3 text-sm tracking-wide flex items-center justify-center gap-2"
          >
            <ShoppingBag className="w-4 h-4" />
            Continuar
          </button>
          <button
            onClick={onLogin}
            className="w-full border border-gray-300 text-gray-700 py-3 hover:border-[#1a1a1a] hover:text-[#1a1a1a] transition-colors text-sm flex items-center justify-center gap-2"
          >
            <User className="w-4 h-4" />
            Entrar para finalizar
          </button>
        </div>

        <p className="text-gray-400 text-xs text-center mt-4 leading-relaxed font-sans">
          Ao entrar, o pedido poderá ser concluído e ficará disponível na sua conta.
        </p>
      </div>
    </div>
  );
}

function FormField({
  label,
  required,
  children,
  error,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  error?: string;
}) {
  return (
    <div>
      <label className="block text-sm text-gray-600 mb-1">
        {label}
        {required ? (
          <span className="text-red-500 ml-0.5">*</span>
        ) : (
          <span className="text-gray-400 text-xs ml-1.5">(opcional)</span>
        )}
      </label>
      {children}
      {error && (
        <p className="flex items-center gap-1 text-red-500 text-xs mt-1">
          <AlertCircle className="w-3 h-3" />
          {error}
        </p>
      )}
    </div>
  );
}

const inputClass =
  "w-full border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:border-[#1a1a1a] transition-colors font-sans";
const inputErrorClass =
  "w-full border border-red-400 px-4 py-2.5 text-sm focus:outline-none focus:border-red-500 transition-colors font-sans";

export default function CheckoutPage() {
  const { cart, clear } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>("dados");
  const [payment, setPayment] = useState<"cartao" | "pix">("cartao");
  const [installments, setInstallments] = useState(1);
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; cpf?: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [shippingQuote, setShippingQuote] = useState<ShippingQuote | null>(null);
  const [shippingLoading, setShippingLoading] = useState(false);
  const [shippingError, setShippingError] = useState<string | null>(null);
  const [addressLoading, setAddressLoading] = useState(false);
  const [addressError, setAddressError] = useState<string | null>(null);
  const [confirmedOrderId, setConfirmedOrderId] = useState<number | null>(null);

  const [form, setForm] = useState({
    nome: user?.name || "",
    email: user?.email || "",
    cpf: user?.id || "",
    telefone: "",
    cep: "",
    rua: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    estado: "",
  });

  const set = (key: keyof typeof form, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const shipping = shippingQuote?.valor ?? 0;
  const finalTotal = cart.total + shipping;

  useEffect(() => {
    const cleanCep = form.cep.replace(/\D/g, "");

    if (cleanCep.length !== 8) {
      setShippingQuote(null);
      setShippingError(null);
      setAddressError(null);
      setShippingLoading(false);
      setAddressLoading(false);
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setShippingLoading(true);
      setAddressLoading(true);
      setShippingError(null);
      setAddressError(null);

      try {
        const quote = await api.post<ShippingQuote>("/shipping/calculate", {
          cep_destino: cleanCep,
        });
        if (!cancelled) {
          setShippingQuote(quote);
        }
      } catch (err) {
        if (!cancelled) {
          setShippingQuote(null);
          setShippingError(
            err instanceof Error
              ? err.message
              : "Não foi possível calcular o frete para este CEP.",
          );
        }
      }

      try {
        const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
        const data = (await response.json()) as {
          erro?: boolean;
          logradouro?: string;
          bairro?: string;
          localidade?: string;
          uf?: string;
        };

        if (!cancelled) {
          if (data.erro) {
            setAddressError("CEP não encontrado.");
          } else {
            setForm((prev) => ({
              ...prev,
              rua: prev.rua || data.logradouro || "",
              bairro: prev.bairro || data.bairro || "",
              cidade: prev.cidade || data.localidade || "",
              estado: prev.estado || data.uf || "",
            }));
          }
        }
      } catch {
        if (!cancelled) {
          setAddressError("Não foi possível consultar o CEP.");
        }
      } finally {
        if (!cancelled) {
          setShippingLoading(false);
          setAddressLoading(false);
        }
      }
    }, 500);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [form.cep]);

  const steps: { key: Step; label: string }[] = [
    { key: "dados", label: "Dados Pessoais" },
    { key: "entrega", label: "Entrega" },
    { key: "pagamento", label: "Pagamento" },
    { key: "confirmado", label: "Confirmado" },
  ];
  const stepIndex = steps.findIndex((s) => s.key === step);

  const validateDados = () => {
    const errors: { email?: string; cpf?: string } = {};
    if (!form.email.trim()) errors.email = "E-mail é obrigatório";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errors.email = "E-mail inválido";
    if (!form.cpf.trim()) errors.cpf = "CPF é obrigatório";
    else if (form.cpf.replace(/\D/g, "").length !== 11)
      errors.cpf = "CPF deve ter 11 dígitos";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleDadosContinue = () => {
    if (!validateDados()) return;
    if (!user) {
      setShowGuestModal(true);
    } else {
      setStep("entrega");
    }
  };

  const handleConfirm = async () => {
    if (!user) {
      setSubmitError("É necessário entrar no sistema para finalizar o pedido.");
      return;
    }

    if (!shippingQuote) {
      setSubmitError("Informe um CEP válido para calcular o frete.");
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    // 1. Cria o pedido (uma única vez — em re-tentativas após falha de
    //    pagamento, reutiliza o pedido já criado para não duplicar).
    let orderId = confirmedOrderId;
    if (orderId == null) {
      try {
        const response = await api.post<{ idPedido: number }>("/orders", {
          items: cart.items.map((i) => ({
            variantSku: i.variant.codigoSku,
            quantidade: i.quantity,
          })),
          couponNumero: cart.cupom ?? null,
          valorFrete: shippingQuote.valor,
          tipoRetirada: "entrega",
        });
        orderId = response.idPedido;
        setConfirmedOrderId(orderId);
      } catch (err) {
        console.error("Erro ao criar pedido:", err);
        setSubmitError(
          err instanceof Error
            ? err.message
            : "Não foi possível concluir o pedido. Tente novamente.",
        );
        setSubmitting(false);
        return;
      }
    }

    // 2. Aciona o pagamento do pedido. "cartao" (UI) → credit_card; PIX força 1 parcela.
    try {
      const captureMethod = payment === "pix" ? "pix" : "credit_card";
      const paymentResult = await api.post<{
        status: string;
        redirectUrl?: string | null;
      }>("/payments", {
        idPedido: orderId,
        captureMethod,
        installments: payment === "pix" ? 1 : installments,
      });

      // Gateway hospedado (InfinitePay) devolve um link de checkout: redireciona.
      if (paymentResult.redirectUrl) {
        clear();
        window.location.href = paymentResult.redirectUrl;
        return;
      }
    } catch (err) {
      console.error("Erro ao processar pagamento:", err);
      setSubmitError(
        err instanceof Error
          ? err.message
          : "Pedido criado, mas o pagamento falhou. Tente novamente.",
      );
      setSubmitting(false);
      return;
    }

    clear();
    setSubmitting(false);
    setStep("confirmado");
  };

  if (step === "confirmado") {
    return (
      <div className="min-h-screen bg-[#f8f8f8] flex items-center justify-center font-sans">
        <div className="bg-white p-10 border border-gray-100 max-w-md w-full mx-4 text-center">
          <div className="w-20 h-20 bg-green-100 flex items-center justify-center mx-auto mb-4 rounded-full">
            <Check className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-gray-900 mb-2 font-serif text-2xl">Pedido Confirmado!</h2>
          <p className="text-gray-500 text-sm mb-2">
            Seu pedido foi realizado com sucesso.
          </p>
          {!user && (
            <p className="text-amber-600 text-xs mb-2 bg-amber-50 border border-amber-100 px-3 py-2">
              Você comprou como convidado. Este pedido não está vinculado a nenhuma conta.
            </p>
          )}
          <div className="bg-gray-50 border border-gray-100 p-4 mb-6 text-sm text-left">
            <p className="text-gray-500">Número do pedido:</p>
            <p className="text-gray-900 font-medium mb-2">
              {confirmedOrderId ? `#${confirmedOrderId}` : "#--"}
            </p>
            <p className="text-gray-500">Total pago:</p>
            <p className="text-gray-900 font-medium">
              {formatCurrency(finalTotal)}
            </p>
          </div>
          <p className="text-gray-400 text-xs mb-6">
            Você receberá um e-mail de confirmação em{" "}
            <strong>{form.email}</strong> com os detalhes do pedido.
          </p>
          <button
            onClick={() => navigate("/")}
            className="bt-principal w-full py-3 text-sm tracking-wide"
          >
            Voltar à Loja
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {showGuestModal && (
        <GuestCheckoutModal
          onContinueAsGuest={() => {
            setShowGuestModal(false);
            setStep("entrega");
          }}
          onLogin={() => {
            setShowGuestModal(false);
            navigate("/conta?retorno=checkout");
          }}
        />
      )}

      <div className="min-h-screen bg-[#f8f8f8]">
        <div className="bg-[#1a1a1a] text-white py-8">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-white mb-4 font-serif text-3xl">Finalizar Compra</h1>
            {!user && (
              <p className="text-gray-400 text-xs mb-4 font-sans">
                Comprando como convidado — sem necessidade de conta.
              </p>
            )}
            <div className="flex items-center gap-2 font-sans">
              {steps.slice(0, 3).map((s, i) => (
                <React.Fragment key={s.key}>
                  <div
                    className={`flex items-center gap-2 ${
                      i <= stepIndex ? "text-white" : "text-gray-500"
                    }`}
                  >
                    <div
                      className={`w-6 h-6 flex items-center justify-center text-xs border rounded-full ${
                        i < stepIndex
                          ? "bg-white text-[#1a1a1a] border-white"
                          : i === stepIndex
                          ? "border-white text-white"
                          : "border-gray-600 text-gray-600"
                      }`}
                    >
                      {i < stepIndex ? <Check className="w-3 h-3" /> : i + 1}
                    </div>
                    <span className="text-sm hidden sm:block">{s.label}</span>
                  </div>
                  {i < 2 && <ChevronRight className="w-4 h-4 text-gray-600" />}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 font-sans">
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="flex-1">
              {step === "dados" && (
                <div className="bg-white p-6 border border-gray-100">
                  <h2 className="text-gray-900 mb-1 font-serif text-xl">Dados Pessoais</h2>
                  <p className="text-gray-400 text-xs mb-5">
                    <span className="text-red-500">*</span> Campos obrigatórios
                    &nbsp;·&nbsp; Nome é opcional
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <FormField label="Nome completo">
                        <input
                          type="text"
                          value={form.nome}
                          onChange={(e) => set("nome", e.target.value)}
                          placeholder="Seu nome (opcional)"
                          className={inputClass}
                        />
                      </FormField>
                    </div>

                    <div className="sm:col-span-2">
                      <FormField label="E-mail" required error={fieldErrors.email}>
                        <input
                          type="email"
                          value={form.email}
                          onChange={(e) => {
                            set("email", e.target.value);
                            if (fieldErrors.email)
                              setFieldErrors((prev) => ({ ...prev, email: undefined }));
                          }}
                          placeholder="seu@email.com"
                          className={fieldErrors.email ? inputErrorClass : inputClass}
                        />
                      </FormField>
                    </div>

                    <div>
                      <FormField label="CPF" required error={fieldErrors.cpf}>
                        <input
                          type="text"
                          value={form.cpf}
                          onChange={(e) => {
                            set("cpf", e.target.value);
                            if (fieldErrors.cpf)
                              setFieldErrors((prev) => ({ ...prev, cpf: undefined }));
                          }}
                          placeholder="000.000.000-00"
                          maxLength={14}
                          className={fieldErrors.cpf ? inputErrorClass : inputClass}
                        />
                      </FormField>
                    </div>

                    <div>
                      <FormField label="Telefone">
                        <input
                          type="tel"
                          value={form.telefone}
                          onChange={(e) => set("telefone", e.target.value)}
                          placeholder="(61) 9 9999-9999"
                          className={inputClass}
                        />
                      </FormField>
                    </div>
                  </div>

                  {!user && (
                    <div className="mt-4 flex items-start gap-2 p-3 bg-gray-50 border border-gray-100 text-xs text-gray-500">
                      <AlertCircle className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                      <span>
                        Você não está logado. Ao continuar, será perguntado se
                        deseja <strong>entrar</strong> (para vincular o pedido à
                        sua conta) ou <strong>comprar como convidado</strong>.
                      </span>
                    </div>
                  )}

                  <button
                    onClick={handleDadosContinue}
                    className="bt-principal mt-6 w-full py-3 flex items-center justify-center gap-2 text-sm tracking-wide"
                  >
                    Continuar <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {step === "entrega" && (
                <div className="bg-white p-6 border border-gray-100">
                  <h2 className="text-gray-900 mb-5 font-serif text-xl">Endereço de Entrega</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      { key: "cep", label: "CEP", type: "text" },
                      { key: "estado", label: "Estado", type: "text" },
                      { key: "rua", label: "Rua", type: "text", full: true },
                      { key: "numero", label: "Número", type: "text" },
                      { key: "complemento", label: "Complemento", type: "text" },
                      { key: "bairro", label: "Bairro", type: "text" },
                      { key: "cidade", label: "Cidade", type: "text" },
                    ].map((f) => (
                      <div key={f.key} className={f.full ? "sm:col-span-2" : ""}>
                        <label className="block text-sm text-gray-600 mb-1">
                          {f.label}
                        </label>
                        <input
                          type={f.type}
                          value={form[f.key as keyof typeof form]}
                          onChange={(e) =>
                            set(f.key as keyof typeof form, e.target.value)
                          }
                          className={inputClass}
                          placeholder={f.label}
                        />
                      </div>
                    ))}
                  </div>
                  {(shippingError || addressError || shippingLoading || addressLoading) && (
                    <div className="mt-4 space-y-1 text-xs">
                      {shippingLoading && (
                        <p className="text-gray-500">Calculando frete pelo CEP informado...</p>
                      )}
                      {addressLoading && (
                        <p className="text-gray-500">Consultando endereço do CEP...</p>
                      )}
                      {shippingError && <p className="text-red-600">{shippingError}</p>}
                      {addressError && <p className="text-amber-600">{addressError}</p>}
                    </div>
                  )}
                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={() => setStep("dados")}
                      className="flex-1 border border-gray-200 text-gray-600 py-3 hover:border-gray-400 transition-colors text-sm"
                    >
                      Voltar
                    </button>
                    <button
                      onClick={() => setStep("pagamento")}
                      className="bt-principal flex-1 py-3 flex items-center justify-center gap-2 text-sm tracking-wide"
                    >
                      Continuar <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {step === "pagamento" && (
                <div className="bg-white p-6 border border-gray-100">
                  <h2 className="text-gray-900 mb-5 font-serif text-xl">Forma de Pagamento</h2>
                  <div className="space-y-3 mb-6">
                    {[
                      {
                        key: "cartao",
                        label: "Cartão de Crédito/Débito",
                        icon: <CreditCard className="w-5 h-5" />,
                      },
                      {
                        key: "pix",
                        label: "PIX",
                        icon: <QrCode className="w-5 h-5" />,
                      },
                    ].map((p) => (
                      <button
                        key={p.key}
                        onClick={() => setPayment(p.key as typeof payment)}
                        className={`w-full flex items-center gap-3 p-4 border text-left transition-colors ${
                          payment === p.key
                            ? "border-[#1a1a1a] bg-gray-50 text-[#1a1a1a]"
                            : "border-gray-200 text-gray-700 hover:border-gray-400"
                        }`}
                      >
                        <span
                          className={
                            payment === p.key ? "text-[#1a1a1a]" : "text-gray-400"
                          }
                        >
                          {p.icon}
                        </span>
                        <span className="text-sm">{p.label}</span>
                        {payment === p.key && (
                          <Check className="w-4 h-4 ml-auto" />
                        )}
                      </button>
                    ))}
                  </div>

                  {payment === "cartao" && (
                    <div className="space-y-4 p-4 bg-gray-50">
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">
                          Número do Cartão
                        </label>
                        <input
                          type="text"
                          placeholder="0000 0000 0000 0000"
                          className="w-full border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:border-[#1a1a1a] bg-white"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm text-gray-600 mb-1">
                            Validade
                          </label>
                          <input
                            type="text"
                            placeholder="MM/AA"
                            className="w-full border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:border-[#1a1a1a] bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-600 mb-1">
                            CVV
                          </label>
                          <input
                            type="text"
                            placeholder="000"
                            className="w-full border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:border-[#1a1a1a] bg-white"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">
                          Nome no Cartão
                        </label>
                        <input
                          type="text"
                          placeholder="Nome como no cartão"
                          className="w-full border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:border-[#1a1a1a] bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">
                          Parcelas
                        </label>
                        <select
                          value={installments}
                          onChange={(e) => setInstallments(Number(e.target.value))}
                          className="w-full border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:border-[#1a1a1a] bg-white"
                        >
                          {[1, 2, 3, 4, 6, 8, 10, 12].map((p) => (
                            <option key={p} value={p}>
                              {p}x de {formatCurrency(finalTotal / p)}
                              {p === 1 ? " à vista" : " sem juros"}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

                  {payment === "pix" && (
                    <div className="p-4 bg-green-50 text-center border border-green-100">
                      <QrCode className="w-16 h-16 text-green-600 mx-auto mb-2" />
                      <p className="text-green-700 text-sm font-medium">
                        Após confirmar, você receberá o QR Code para pagamento.
                      </p>
                      <p className="text-green-600 text-xs mt-1">
                        O valor do PIX é o mesmo dos demais meios de pagamento.
                      </p>
                    </div>
                  )}

                  {submitError && (
                    <p className="flex items-center gap-1 text-red-500 text-xs mt-4">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      {submitError}
                    </p>
                  )}
                  {!user && (
                    <p className="text-xs text-amber-600 mt-4">
                      Entre no sistema para habilitar a finalização do pedido.
                    </p>
                  )}

                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={() => setStep("entrega")}
                      disabled={submitting}
                      className="flex-1 border border-gray-200 text-gray-600 py-3 hover:border-gray-400 transition-colors text-sm disabled:opacity-50"
                    >
                      Voltar
                    </button>
                    <button
                      onClick={handleConfirm}
                      disabled={submitting || !user || !shippingQuote || shippingLoading}
                      className="flex-1 bg-[#1a1a1a] text-white py-3 hover:bg-[#333333] transition-colors text-sm tracking-wide disabled:opacity-60"
                    >
                      {submitting ? "Processando..." : "Confirmar Pedido"}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="lg:w-72 shrink-0">
              <div className="bg-white p-5 border border-gray-100 sticky top-24">
                <h3 className="text-gray-900 mb-4 font-serif text-lg">Resumo</h3>
                <div className="space-y-3 mb-4 max-h-48 overflow-y-auto pr-2">
                  {cart.items.map((item) => (
                    <div
                      key={item.variant.codigoSku}
                      className="flex gap-2"
                    >
                      <div className="w-12 h-14 relative shrink-0">
                        <img
                          src={item.variant.images?.[0]?.url || "/hero-dress.png"}
                          alt={item.variant.produto.titulo}
                          className="object-cover object-top"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-700 line-clamp-1">
                          {item.variant.produto.titulo}
                        </p>
                        <p className="text-xs text-gray-500">
                          {item.variant.tamanho} · {item.variant.cor} · x{item.quantity}
                        </p>
                        <p className="text-xs text-gray-800 font-medium">
                          {formatCurrency((item.variant.precoVariante ?? item.variant.produto.precoBase) * item.quantity)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="border-t border-gray-100 pt-3 space-y-2 text-sm">
                  <div className="flex justify-between text-gray-500">
                    <span>Subtotal</span>
                    <span>{formatCurrency(cart.subtotal)}</span>
                  </div>
                  {cart.desconto > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Desconto {cart.cupom ? `(${cart.cupom})` : ""}</span>
                      <span>-{formatCurrency(cart.desconto)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-gray-500">
                    <span>Frete</span>
                    {shippingLoading ? (
                      <span>Calculando...</span>
                    ) : shippingQuote ? (
                      <span>{formatCurrency(shippingQuote.valor)}</span>
                    ) : (
                      <span>Informe um CEP válido</span>
                    )}
                  </div>
                  {shippingQuote && (
                    <p className="text-xs text-gray-400">
                      Prazo estimado: {shippingQuote.prazo_dias} dia
                      {shippingQuote.prazo_dias !== 1 ? "s" : ""} útil
                    </p>
                  )}
                </div>
                <div className="border-t border-gray-100 mt-3 pt-3 flex justify-between items-center">
                  <span className="text-gray-900 font-medium">Total</span>
                  <span className="text-gray-900 font-bold text-lg">
                    {formatCurrency(finalTotal)}
                  </span>
                </div>

                {!user && (
                  <p className="text-gray-400 text-xs mt-4 pt-3 border-t border-gray-100 text-center">
                    Compra como convidado — sem necessidade de conta.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
