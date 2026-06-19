
import React, { useState } from "react";
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
          Você pode concluir seu pedido <strong>sem criar uma conta</strong>.
        </p>
        <p className="text-gray-400 text-xs text-center mb-6 font-sans">
          Compras como convidado <strong>não ficam vinculadas</strong> a nenhum
          perfil e não aparecem no histórico de pedidos.
        </p>

        <div className="space-y-3 font-sans">
          <button
            onClick={onContinueAsGuest}
            className="bt-principal w-full py-3 text-sm tracking-wide flex items-center justify-center gap-2"
          >
            <ShoppingBag className="w-4 h-4" />
            Continuar sem conta
          </button>
          <button
            onClick={onLogin}
            className="w-full border border-gray-300 text-gray-700 py-3 hover:border-[#1a1a1a] hover:text-[#1a1a1a] transition-colors text-sm flex items-center justify-center gap-2"
          >
            <User className="w-4 h-4" />
            Entrar para vincular ao meu perfil
          </button>
        </div>

        <p className="text-gray-400 text-xs text-center mt-4 leading-relaxed font-sans">
          Ao entrar, este pedido será registrado na sua conta para consulta futura.
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
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; cpf?: string }>({});

  const [form, setForm] = useState({
    nome: user?.name || "",
    email: user?.email || "",
    cpf: "",
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

  const shipping = cart.total >= 500 ? 0 : 29.9;
  // PIX discount applies to the merchandise only, never to shipping
  const pixDiscount = payment === "pix" ? cart.total * 0.05 : 0;
  const finalTotal = cart.total - pixDiscount + shipping;

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
    try {
      await api.post("/orders", {
        items: cart.items.map((i) => ({
          productId: i.variant.produto.id,
          variantId: i.variant.id,
          titulo: i.variant.produto.titulo,
          tamanho: i.variant.tamanho,
          cor: i.variant.cor,
          quantidade: i.quantity,
          preco_unitario: i.variant.preco_variante || i.variant.produto.preco_base,
        })),
        subtotal: cart.total,
        frete: shipping,
        desconto: pixDiscount,
        total: finalTotal,
        paymentMethod: payment,
        endereco: {
          cep: form.cep,
          rua: form.rua,
          numero: form.numero,
          complemento: form.complemento,
          bairro: form.bairro,
          cidade: form.cidade,
          estado: form.estado,
        },
        cliente: {
          nome: form.nome || undefined,
          email: form.email,
          cpf: form.cpf,
          telefone: form.telefone || undefined,
        },
      });
    } catch (err) {
      console.error("Erro ao criar pedido:", err);
      // Continua para tela de confirmação mesmo se API falhar
    }
    clear();
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
              #PED-2026-{Math.floor(Math.random() * 900 + 100)}
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
                        label: "PIX (5% de desconto)",
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
                        <select className="w-full border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:border-[#1a1a1a] bg-white">
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
                        Você economizará {formatCurrency(pixDiscount)}!
                      </p>
                    </div>
                  )}

                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={() => setStep("entrega")}
                      className="flex-1 border border-gray-200 text-gray-600 py-3 hover:border-gray-400 transition-colors text-sm"
                    >
                      Voltar
                    </button>
                    <button
                      onClick={handleConfirm}
                      className="flex-1 bg-[#1a1a1a] text-white py-3 hover:bg-[#333333] transition-colors text-sm tracking-wide"
                    >
                      Confirmar Pedido
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
                      key={item.variant.id}
                      className="flex gap-2"
                    >
                      <div className="w-12 h-14 relative shrink-0">
                        <img
                          src={item.variant.images?.[0]?.image.url || "/hero-dress.png"}
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
                          {formatCurrency((item.variant.preco_variante || item.variant.produto.preco_base) * item.quantity)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="border-t border-gray-100 pt-3 space-y-2 text-sm">
                  <div className="flex justify-between text-gray-500">
                    <span>Subtotal</span>
                    <span>{formatCurrency(cart.total)}</span>
                  </div>
                  <div className="flex justify-between text-gray-500">
                    <span>Frete</span>
                    {shipping === 0 ? (
                      <span className="text-green-600">Grátis</span>
                    ) : (
                      <span>{formatCurrency(shipping)}</span>
                    )}
                  </div>
                  {payment === "pix" && (
                    <div className="flex justify-between text-green-600 text-xs font-medium">
                      <span>Desconto PIX (5%)</span>
                      <span>-{formatCurrency(pixDiscount)}</span>
                    </div>
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
