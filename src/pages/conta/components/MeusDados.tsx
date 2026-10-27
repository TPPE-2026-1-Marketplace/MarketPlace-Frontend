import Button from "@/components/ui/Button";
import { buttonClassName } from "@/components/ui/button-variants";
import Input from "@/components/ui/Input";
import type { AccountTabKey } from "./AccountNav";

interface MeusDadosForm {
  name: string;
  email: string;
  telefone: string;
  cpf: string;
}

interface MeusDadosProps {
  isEditing: boolean;
  saving: boolean;
  message: { type: "success" | "error"; text: string } | null;
  telefoneError: string | null;
  form: MeusDadosForm;
  displayName: string;
  displayEmail: string;
  displayPhone: string;
  displayCpf: string;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
  onFieldChange: (key: keyof MeusDadosForm, value: string) => void;
  onSelectTab: (tab: AccountTabKey) => void;
}

function DadoDeLeitura({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="flex flex-1 flex-col gap-2">
      <p className="text-xs text-[var(--foreground-secondary)]">{rotulo}</p>
      <p className="text-sm font-medium text-[var(--foreground)]">{valor}</p>
    </div>
  );
}

export default function MeusDados({
  isEditing,
  saving,
  message,
  telefoneError,
  form,
  displayName,
  displayEmail,
  displayPhone,
  displayCpf,
  onEdit,
  onCancel,
  onSave,
  onFieldChange,
  onSelectTab,
}: MeusDadosProps) {
  return (
    <div className="flex flex-col gap-6" data-testid="meus-dados">
      <div className="flex flex-col gap-4 sm:flex-row">
        <button
          onClick={() => onSelectTab("pedidos")}
          className="flex flex-1 flex-col items-start gap-2 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--background-card)] p-6 text-left transition-colors hover:border-[var(--border-hover)]"
        >
          <p className="text-sm font-semibold text-[var(--foreground)]">Meus pedidos →</p>
          <p className="text-xs text-[var(--foreground-secondary)]">Acompanhe suas compras</p>
        </button>
        <button
          onClick={() => onSelectTab("favoritos")}
          className="flex flex-1 flex-col items-start gap-2 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--background-card)] p-6 text-left transition-colors hover:border-[var(--border-hover)]"
        >
          <p className="text-sm font-semibold text-[var(--foreground)]">Meus favoritos →</p>
          <p className="text-xs text-[var(--foreground-secondary)]">Veja os vestidos que você salvou</p>
        </button>
      </div>

      <div className="flex flex-col gap-6 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--background-card)] p-6">
        {message && (
          <div
            className={
              message.type === "success"
                ? "border border-green-200 bg-green-50 p-3 text-sm text-green-700"
                : "border border-red-200 bg-red-50 p-3 text-sm text-red-700"
            }
          >
            {message.text}
          </div>
        )}

        {isEditing ? (
          <>
            <div>
              <h2 className="text-xl font-semibold text-[var(--foreground)]">Editar dados pessoais</h2>
              <p className="mt-1 text-sm text-[var(--foreground-secondary)]">
                Mantenha seus dados atualizados para facilitar suas compras.
              </p>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row">
              <Input
                label="Nome completo"
                value={form.name}
                onChange={(e) => onFieldChange("name", e.target.value)}
                placeholder="Informe seu nome"
                containerClassName="flex-1"
              />
              <Input
                label="E-mail"
                type="email"
                value={form.email}
                onChange={(e) => onFieldChange("email", e.target.value)}
                placeholder="Informe seu e-mail"
                containerClassName="flex-1"
              />
            </div>

            <div className="flex flex-col gap-4 sm:flex-row">
              <Input
                label="Telefone"
                type="tel"
                inputMode="tel"
                value={form.telefone}
                error={telefoneError ?? undefined}
                onChange={(e) => onFieldChange("telefone", e.target.value)}
                placeholder="Informe seu telefone"
                containerClassName="flex-1"
              />
              <Input
                label="CPF"
                value={form.cpf}
                disabled
                helper="O CPF é a chave da sua conta e não pode ser alterado."
                placeholder="Informe seu cpf"
                containerClassName="flex-1"
              />
            </div>

            <div className="flex items-center gap-3">
              <Button onClick={onSave} disabled={saving} loading={saving} variant="action" size="touch">
                Salvar alterações
              </Button>
              <button onClick={onCancel} className={buttonClassName({ variant: "outline-neutral", size: "touch" })}>
                Cancelar
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-[var(--foreground)]">Dados pessoais</h2>
                <p className="mt-1 text-sm text-[var(--foreground-secondary)]">Confira as informações da sua conta.</p>
              </div>
              <button onClick={onEdit} className={buttonClassName({ variant: "outline-neutral", size: "touch" })}>
                Editar dados
              </button>
            </div>

            <div className="flex flex-col gap-4 border-t border-[var(--border)] pt-4 sm:flex-row">
              <DadoDeLeitura rotulo="Nome completo" valor={displayName} />
              <DadoDeLeitura rotulo="E-mail" valor={displayEmail} />
            </div>
            <div className="flex flex-col gap-4 border-t border-[var(--border)] pt-4 sm:flex-row">
              <DadoDeLeitura rotulo="Telefone" valor={displayPhone || "Não informado"} />
              <DadoDeLeitura
                rotulo="CPF"
                valor={displayCpf ? `***.***.***-${displayCpf.slice(-2)}` : "Não informado"}
              />
            </div>
          </>
        )}
      </div>

      <div className="rounded-[var(--radius-lg)] bg-[var(--background-secondary)] p-6">
        <p className="text-sm font-semibold text-[var(--foreground)]">Seus dados, com cuidado</p>
        <p className="mt-1 text-sm text-[var(--foreground-secondary)]">
          Seus dados são usados para processar pedidos, entregas e o atendimento da sua conta.
        </p>
      </div>
    </div>
  );
}
