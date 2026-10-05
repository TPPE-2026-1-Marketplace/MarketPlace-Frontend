import Input from "@/components/ui/Input";
import { maskCpf, maskPhone } from "@/lib/utils";
import CheckoutSection from "./CheckoutSection";
import { checkoutFieldProps, type CheckoutFieldsState } from "./fieldProps";

export default function ContactSection(state: CheckoutFieldsState) {
  return (
    <CheckoutSection
      id="dados"
      title="Dados de contato"
      subtitle="Usaremos estes dados para enviar atualizações do pedido."
      mobileSubtitle="Atualizações por e-mail."
      className="rounded-[var(--radius-lg)]"
    >
      <div className="grid gap-[15px] lg:grid-cols-[370px_370px] lg:gap-x-3">
        <Input
          label="Nome completo"
          placeholder="Mariana Lima"
          autoComplete="name"
          {...checkoutFieldProps("nome", state)}
        />
        <Input
          label="E-mail"
          type="email"
          placeholder="mariana@email.com"
          autoComplete="email"
          {...checkoutFieldProps("email", state)}
        />
      </div>
      <div className="grid gap-[15px] lg:grid-cols-[220px_520px] lg:gap-x-3">
        <Input
          label="CPF"
          placeholder="000.000.000-00"
          inputMode="numeric"
          {...checkoutFieldProps("cpf", state, maskCpf)}
        />
        <Input
          label="Telefone"
          type="tel"
          placeholder="(00) 00000-0000"
          autoComplete="tel-national"
          {...checkoutFieldProps("telefone", state, maskPhone)}
        />
      </div>
    </CheckoutSection>
  );
}
