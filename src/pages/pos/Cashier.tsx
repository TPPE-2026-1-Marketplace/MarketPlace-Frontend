import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle, AlertCircle } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { usePOS } from "../../context/POSContext";
import { ApiProduct, POSSaleItem, POSSeller } from "../../data/pos-types";
import { SaleCompleted, SaleFailed } from "../../components/pos/SaleResult";
import { loadPOSProducts, loadPOSSellers, remainingPhysicalStock } from "@/lib/pos-catalog";
import { CPF_INVALID_MESSAGE, isValidCpf } from "../../lib/br-validators";
import { maskCpf } from "../../lib/utils";
import Button from "@/components/ui/Button";
import { adminButtonClassName } from "@/components/manager/adminClasses";
import SaleCatalog from "@/components/pos/SaleCatalog";
import SaleCheckout from "@/components/pos/SaleCheckout";

type SaleOutcome =
  | { status: "completed"; saleId: string; customerName?: string; sellerCode: string; total: number }
  | { status: "failed"; reason?: string };

export function Cashier() {
  const navigate = useNavigate();
  const { user, isInternalUser } = useAuth();
  const { currentSale, addItem, removeItem, updateQuantity, clearSale, completeSale } = usePOS();

  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<ApiProduct | null>(null);
  const [selectedVariantSku, setSelectedVariantSku] = useState("");
  const [quantity, setQuantity] = useState(1);

  const [sellers, setSellers] = useState<POSSeller[]>([]);
  const [sellersLoading, setSellersLoading] = useState(true);
  const [sellersError, setSellersError] = useState("");
  const [sellerCode, setSellerCode] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerCpf, setCustomerCpf] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"card" | "pix" | "dinheiro">("card");
  
  const [showCheckout, setShowCheckout] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [outcome, setOutcome] = useState<SaleOutcome | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      setProducts(await loadPOSProducts());
    } catch {
      setError("Erro ao carregar produtos. Verifique a conexão.");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSellers = useCallback(async () => {
    setSellersLoading(true);
    setSellersError("");
    try {
      setSellers(await loadPOSSellers());
    } catch {
      setSellersError("Não foi possível carregar os vendedores. Você pode informar o código manualmente.");
    } finally {
      setSellersLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) {
      navigate("/login", { replace: true });
      return;
    }
    if (!isInternalUser) {
      navigate("/", { replace: true });
      return;
    }
    void fetchProducts();
    void fetchSellers();
  }, [user, isInternalUser, navigate, fetchProducts, fetchSellers]);

  const filteredProducts = products.filter(
    (p) =>
      p.titulo.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase())
  );

  const subtotal = currentSale.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const total = subtotal;

  const handleAddToSale = () => {
    if (!selectedProduct || !selectedVariantSku) {
      setMessage({ type: "error", text: "Selecione o produto e a variação." });
      return;
    }

    const variant = selectedProduct.variants.find((v) => v.codigoSku === selectedVariantSku);
    if (!variant) {
      setMessage({ type: "error", text: "Variação não encontrada." });
      return;
    }

    if (remainingPhysicalStock(variant, currentSale) < quantity) {
      setMessage({ type: "error", text: "Quantidade indisponível no estoque da loja." });
      return;
    }

    const item: POSSaleItem = {
      product: selectedProduct,
      variantSku: variant.codigoSku,
      size: variant.tamanho || "Padrão",
      color: variant.cor || "Padrão",
      quantity,
      unitPrice: variant.precoVariante ?? selectedProduct.precoBase,
    };

    addItem(item);
    setMessage({ type: "success", text: "Produto adicionado à venda!" });
    setSelectedProduct(null);
    setSelectedVariantSku("");
    setQuantity(1);
    setSearch("");

    setTimeout(() => setMessage(null), 2000);
  };

  const handleFinalizeSale = () => {
    if (currentSale.length === 0) {
      setMessage({ type: "error", text: "Adicione produtos à venda." });
      return;
    }
    if (!sellerCode && user?.role === "employee") {
      setSellerCode(user.sellerCode || user.id);
    }
    setShowCheckout(true);
  };

  const handleCompleteSale = async () => {
    const selectedSeller = sellers.find((seller) => seller.cpf === sellerCode.trim() || seller.code?.toLowerCase() === sellerCode.trim().toLowerCase());
    const finalSellerId = selectedSeller ? selectedSeller.code || selectedSeller.cpf : sellerCode.trim();

    if (!finalSellerId.trim()) {
      setMessage({ type: "error", text: "Informe o código do vendedor (CPF)." });
      return;
    }

    if (!customerName.trim()) {
      setMessage({ type: "error", text: "O nome do cliente é obrigatório." });
      return;
    }

    // CPF do cliente é opcional, mas se foi informado precisa ser válido.
    if (customerCpf.trim() && !isValidCpf(customerCpf)) {
      setMessage({ type: "error", text: CPF_INVALID_MESSAGE });
      return;
    }

    setIsCompleting(true);
    const result = await completeSale(
      paymentMethod,
      finalSellerId,
      customerName || undefined,
      customerCpf || undefined,
      customerPhone || undefined,
      customerEmail || undefined
    );
    setIsCompleting(false);

    if (result.success && result.saleId) {
      setOutcome({
        status: "completed",
        saleId: result.saleId,
        customerName: customerName || undefined,
        sellerCode: finalSellerId,
        total,
      });
      setShowCheckout(false);
      setSellerCode("");
      setCustomerName("");
      setCustomerCpf("");
      setCustomerPhone("");
      setCustomerEmail("");
      void fetchProducts();
    } else {
      // Os itens e os dados do fechamento continuam preservados para a nova tentativa.
      setShowCheckout(false);
      setOutcome({ status: "failed", reason: result.message });
    }
  };

  // A tela de falha continua visível durante a nova tentativa; o resultado a substitui.
  const handleRetrySale = () => {
    void handleCompleteSale();
  };

  const handleBackToSale = () => setOutcome(null);

  const handleCancelCheckout = () => {
    setShowCheckout(false);
    setCustomerName("");
    setCustomerCpf("");
    setCustomerPhone("");
    setCustomerEmail("");
  };

  if (!user || !isInternalUser) return null;

  return (
    <main className="flex min-h-screen flex-col gap-6 bg-[var(--background-store)] p-4 text-[var(--foreground)] lg:p-8">
      <header className="flex items-start gap-4">
        <div className="flex min-w-0 max-w-[170px] flex-1 flex-col gap-1 sm:max-w-none lg:max-w-[920px]">
          <h1 className="text-xl font-semibold leading-7 min-[375px]:whitespace-nowrap">PDV · Nova venda</h1>
          <p className="text-xs leading-[18px] text-[var(--foreground-secondary)]">
            {user.name} · {user.role === "manager" ? "Gerente" : user.role === "superadmin" ? "Admin" : user.role === "cashier" ? "Caixa" : "Vendedor"}
          </p>
        </div>
        <Button variant="outline-neutral" size="sm" className={adminButtonClassName + " w-[140px] min-w-0 shrink-0 lg:w-[180px]"} onClick={() => navigate("/selecionar-modulo")}>Painel</Button>
      </header>

      {message && (
        <div role={message.type === "error" ? "alert" : "status"} className={"flex items-center gap-2 rounded-[var(--radius-md)] border p-3 text-sm " + (message.type === "error" ? "border-red-200 bg-red-50 text-red-700" : "border-green-200 bg-green-50 text-green-700")}>
          {message.type === "error" ? <AlertCircle className="size-4 shrink-0" aria-hidden="true" /> : <CheckCircle className="size-4 shrink-0" aria-hidden="true" />}
          {message.text}
        </div>
      )}

      {outcome ? (
        outcome.status === "completed" ? (
          <SaleCompleted saleId={outcome.saleId} customerName={outcome.customerName} sellerCode={outcome.sellerCode} total={outcome.total} onNewSale={() => setOutcome(null)} />
        ) : (
          <SaleFailed reason={outcome.reason} retrying={isCompleting} onRetry={handleRetrySale} onBack={handleBackToSale} />
        )
      ) : showCheckout ? (
        <SaleCheckout
          sellerCode={sellerCode}
          sellers={sellers} sellersLoading={sellersLoading} sellersError={sellersError} onReloadSellers={fetchSellers}
          onSellerChange={setSellerCode}
          customerName={customerName} onNameChange={setCustomerName}
          customerCpf={customerCpf} onCpfChange={(value) => setCustomerCpf(maskCpf(value))}
          customerPhone={customerPhone} onPhoneChange={setCustomerPhone}
          customerEmail={customerEmail} onEmailChange={setCustomerEmail}
          paymentMethod={paymentMethod} onPaymentChange={setPaymentMethod}
          items={currentSale} total={total} completing={isCompleting}
          onConfirm={handleCompleteSale} onCancel={handleCancelCheckout}
        />
      ) : (
        <SaleCatalog
          products={filteredProducts} loading={loading} error={error}
          search={search} onSearch={setSearch} onReload={fetchProducts}
          selectedProduct={selectedProduct}
          onSelectProduct={(product) => { setSelectedProduct(product); setSelectedVariantSku(""); setQuantity(1); }}
          variantSku={selectedVariantSku} onVariantChange={setSelectedVariantSku}
          quantity={quantity} onQuantityChange={setQuantity} onAdd={handleAddToSale}
          items={currentSale} total={total} onRemove={removeItem}
          onUpdateQuantity={(index, nextQuantity) => {
            const item = currentSale[index];
            const variant = item.product.variants.find((variant) => variant.codigoSku === item.variantSku);
            if (nextQuantity <= item.quantity || nextQuantity - item.quantity <= remainingPhysicalStock(variant, currentSale)) updateQuantity(index, nextQuantity);
          }} onClear={clearSale} onCheckout={handleFinalizeSale}
        />
      )}
    </main>
  );
}
