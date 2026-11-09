import AdminField from "@/components/manager/AdminField";
import { adminButtonClassName, adminCardClassName, adminControlClassName } from "@/components/manager/adminClasses";
import Button from "@/components/ui/Button";
import type { POSSaleItem, POSSeller } from "@/data/pos-types";
import { cn, formatCurrency } from "@/lib/utils";

type PaymentMethod = "card" | "pix" | "dinheiro";
interface SaleCheckoutProps {
  sellerCode: string;
  sellers: POSSeller[];
  sellersLoading: boolean;
  sellersError: string;
  onReloadSellers: () => void;
  onSellerChange: (value: string) => void;
  customerName: string;
  onNameChange: (value: string) => void;
  customerCpf: string;
  onCpfChange: (value: string) => void;
  customerPhone: string;
  onPhoneChange: (value: string) => void;
  customerEmail: string;
  onEmailChange: (value: string) => void;
  paymentMethod: PaymentMethod;
  onPaymentChange: (value: PaymentMethod) => void;
  items: POSSaleItem[];
  total: number;
  completing: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const paymentMethods: { value: PaymentMethod; label: string; hint: string }[] = [
  { value: "card", label: "Cartão", hint: "Confira a aprovação na maquininha antes de registrar a venda." },
  { value: "pix", label: "Pix", hint: "Confira o pagamento no sistema de recebimento antes de confirmar." },
  { value: "dinheiro", label: "Dinheiro", hint: "Confira o valor recebido antes de registrar a venda." },
];

/** Finalização em página, com resumo ao lado no desktop e abaixo no mobile. */
export default function SaleCheckout(props: SaleCheckoutProps) {
  const selectedSeller = props.sellers.find((seller) => seller.cpf === props.sellerCode.trim() || seller.code?.toLowerCase() === props.sellerCode.trim().toLowerCase());
  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,820fr)_minmax(0,532fr)]">
      <form className={cn(adminCardClassName, "flex min-w-0 flex-col items-start gap-4 p-6")} noValidate onSubmit={(event) => { event.preventDefault(); props.onConfirm(); }} aria-labelledby="pdv-checkout-title">
        <h2 id="pdv-checkout-title" className="text-[32px] font-semibold leading-[38px]">Finalizar venda</h2>
        <p className="text-sm leading-[22px] text-[var(--foreground-secondary)]">Confira os dados e registre a forma de pagamento.</p>
        <AdminField label="Selecionar vendedor" htmlFor="pdv-seller-select" className="w-full lg:max-w-[760px]">
          <select id="pdv-seller-select" value={selectedSeller?.cpf ?? ""} disabled={props.sellersLoading || props.completing || props.sellers.length === 0} onChange={(event) => {
            const seller = props.sellers.find((seller) => seller.cpf === event.target.value);
            props.onSellerChange(seller ? seller.code || seller.cpf : "");
          }} className={adminControlClassName}>
            <option value="">{props.sellersLoading ? "Carregando vendedores..." : "Selecione um vendedor"}</option>
            {props.sellers.map((seller) => <option key={seller.cpf} value={seller.cpf}>{seller.name}{seller.code ? " · " + seller.code : ""}</option>)}
          </select>
        </AdminField>
        {props.sellersError && <div className="flex flex-col items-start gap-2" role="status"><p className="text-xs text-[var(--color-warning-text)]">{props.sellersError}</p><Button type="button" variant="outline-neutral" size="sm" disabled={props.completing} onClick={props.onReloadSellers}>Recarregar vendedores</Button></div>}
        {!props.sellersLoading && !props.sellersError && props.sellers.length === 0 && <p className="text-xs text-[var(--foreground-muted)]">Nenhum vendedor cadastrado. Informe o código ou CPF.</p>}
        <AdminField label="Código do vendedor *" htmlFor="pdv-seller" className="w-full lg:max-w-[760px]">
          <input id="pdv-seller" value={props.sellerCode} onChange={(event) => props.onSellerChange(event.target.value)} placeholder="Ex: VEND01 ou CPF" disabled={props.completing} required className={adminControlClassName} />
        </AdminField>
        <AdminField label="Nome da cliente *" htmlFor="pdv-customer-name" className="w-full lg:max-w-[760px]">
          <input id="pdv-customer-name" value={props.customerName} onChange={(event) => props.onNameChange(event.target.value)} placeholder="Nome completo do cliente" autoComplete="name" disabled={props.completing} required className={adminControlClassName} />
        </AdminField>
        <AdminField label="CPF (opcional)" htmlFor="pdv-customer-cpf" className="w-full lg:max-w-[760px]">
          <input id="pdv-customer-cpf" inputMode="numeric" value={props.customerCpf} onChange={(event) => props.onCpfChange(event.target.value)} placeholder="CPF do cliente" disabled={props.completing} className={adminControlClassName} />
        </AdminField>
        <AdminField label="Telefone (opcional)" htmlFor="pdv-customer-phone" className="w-full lg:max-w-[760px]">
          <input id="pdv-customer-phone" type="tel" value={props.customerPhone} onChange={(event) => props.onPhoneChange(event.target.value)} placeholder="(61) 99999-0000" autoComplete="tel" disabled={props.completing} className={adminControlClassName} />
        </AdminField>
        <AdminField label="E-mail (opcional)" htmlFor="pdv-customer-email" className="w-full lg:max-w-[760px]">
          <input id="pdv-customer-email" type="email" value={props.customerEmail} onChange={(event) => props.onEmailChange(event.target.value)} placeholder="cliente@example.com" autoComplete="email" disabled={props.completing} className={adminControlClassName} />
        </AdminField>
        <fieldset className="flex w-full min-w-0 flex-col gap-4">
          <legend className="mb-4 text-xl font-semibold leading-7">Forma de pagamento</legend>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            {paymentMethods.map((method) => (
              <Button key={method.value} type="button" variant={props.paymentMethod === method.value ? "action" : "outline-neutral"} size="sm" className={cn(adminButtonClassName, "w-full sm:w-[180px]")} aria-pressed={props.paymentMethod === method.value} disabled={props.completing} onClick={() => props.onPaymentChange(method.value)}>{method.label}</Button>
            ))}
          </div>
          <p className="text-xs leading-[18px] text-[var(--foreground-secondary)]" aria-live="polite">{paymentMethods.find((method) => method.value === props.paymentMethod)?.hint}</p>
        </fieldset>
        <Button type="submit" variant="action" size="sm" className={adminButtonClassName} loading={props.completing}>Confirmar venda</Button>
        <Button type="button" variant="outline-neutral" size="sm" className={adminButtonClassName} disabled={props.completing} onClick={props.onCancel}>Cancelar finalização</Button>
      </form>
      <section className={cn(adminCardClassName, "flex min-w-0 flex-col gap-4 p-6")} aria-labelledby="pdv-summary-title">
        <h2 id="pdv-summary-title" className="text-xl font-semibold leading-7">Resumo da venda</h2>
        {props.items.map((item) => (
          <p key={item.variantSku} className="text-sm leading-[22px]">{item.product.titulo} · {item.color} / {item.size} · {item.quantity} {item.quantity === 1 ? "unidade" : "unidades"}</p>
        ))}
        <p className="text-2xl font-semibold leading-8">Total · {formatCurrency(props.total)}</p>
      </section>
    </div>
  );
}
