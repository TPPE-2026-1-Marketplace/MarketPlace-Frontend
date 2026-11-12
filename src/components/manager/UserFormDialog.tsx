import { useState } from "react";
import Button from "@/components/ui/Button";
import type { UserRole } from "@/context/AuthContext";
import type { EmployeePayload } from "@/hooks/useManagementEmployees";
import { ApiError } from "@/lib/api";
import { CPF_INVALID_MESSAGE, PHONE_INVALID_MESSAGE, isValidCpf, isValidPhone } from "@/lib/br-validators";
import {
  STAFF_ROLE_LABELS,
  mapFrontendToRole,
  mapRoleToFrontend,
  type ApiEmployee,
} from "@/lib/employees";
import { maskCpf, maskPhone, obscureCpf, onlyDigits } from "@/lib/utils";
import AdminDialog from "./AdminDialog";
import AdminField from "./AdminField";
import SavedConfirmation from "./SavedConfirmation";
import { adminButtonClassName, adminControlClassName } from "./adminClasses";

/** Perfis que o administrador atribui no painel (o backend só aceita escrita do administrador). */
const EDITABLE_ROLES: UserRole[] = ["employee", "cashier", "manager", "superadmin"];

interface UserForm {
  cpf: string;
  name: string;
  email: string;
  password: string;
  phone: string;
  role: UserRole;
  sellerCode: string;
  commissionRate: string;
  salesTarget: string;
  active: boolean;
}

const EMPTY_FORM: UserForm = {
  cpf: "",
  name: "",
  email: "",
  password: "",
  phone: "",
  role: "employee",
  sellerCode: "",
  commissionRate: "5",
  salesTarget: "10000",
  active: true,
};

function toForm(employee: ApiEmployee): UserForm {
  return {
    cpf: maskCpf(employee.cpf),
    name: employee.person.nome,
    email: employee.person.email,
    password: "",
    phone: maskPhone(employee.person.telefone ?? ""),
    role: mapRoleToFrontend(employee.role_perfil),
    sellerCode: employee.codigo_funcionario ?? "",
    commissionRate: String(Number(employee.taxa_comissao) * 100 || 5),
    salesTarget: String(Number(employee.meta_vendas) || 10000),
    active: employee.ativo,
  };
}

/** Valida o formulário e devolve a mensagem do primeiro problema, ou null. */
function validate(form: UserForm, employee: ApiEmployee | null): string | null {
  if (!form.cpf || !form.name.trim() || !form.email.trim() || (!employee && !form.password)) {
    return "Preencha todos os campos obrigatórios.";
  }
  const cpf = onlyDigits(form.cpf);
  if (cpf.length !== 11) return "CPF deve conter exatamente 11 dígitos numéricos.";
  // Na edição o CPF não muda e já existe no banco; só o cadastro novo checa os dígitos.
  if (!employee && !isValidCpf(cpf)) return CPF_INVALID_MESSAGE;
  const phone = onlyDigits(form.phone);
  const originalPhone = onlyDigits(employee?.person.telefone ?? "");
  if (phone && phone !== originalPhone && !isValidPhone(phone)) return PHONE_INVALID_MESSAGE;
  if (form.role === "employee" && !form.sellerCode.trim()) return "Código de vendedor é obrigatório para vendedores.";
  return null;
}

function toPayload(form: UserForm, employee: ApiEmployee | null): EmployeePayload {
  const phone = onlyDigits(form.phone);
  const originalPhone = onlyDigits(employee?.person.telefone ?? "");
  const isSeller = form.role === "employee";
  const payload: EmployeePayload = {
    nome: form.name.trim(),
    email: form.email.trim(),
    // Na edição só envia o telefone se mudou (null remove): um telefone antigo fora do
    // padrão não impede de editar os outros campos.
    telefone: employee ? (phone !== originalPhone ? phone || null : undefined) : phone || undefined,
    ativo: form.active,
    role_perfil: mapFrontendToRole(form.role),
    taxa_comissao: isSeller ? Number(form.commissionRate) / 100 : undefined,
    meta_vendas: isSeller ? Number(form.salesTarget) : undefined,
    codigo_funcionario: isSeller ? form.sellerCode.trim() : undefined,
  };
  if (form.password) payload.senha = form.password;
  if (!employee) payload.cpf = onlyDigits(form.cpf);
  return payload;
}

interface UserFormDialogProps {
  /** null = novo cadastro. */
  employee: ApiEmployee | null;
  open: boolean;
  /** Gerente vê os dados, mas só o administrador altera (regra do backend). */
  readOnly: boolean;
  /** CPF de quem está logado: não pode desativar a si mesmo. */
  currentUserCpf?: string;
  onClose: () => void;
  onCreate: (payload: EmployeePayload) => Promise<void>;
  onUpdate: (cpf: string, payload: EmployeePayload) => Promise<void>;
}

/**
 * Frames "Usuários / Detalhe ou edição" (755:2275), "Novo cadastro" (755:2388) e
 * "Confirmação" (755:2366). A desativação passa por uma confirmação antes de salvar.
 */
export default function UserFormDialog(props: UserFormDialogProps) {
  // A key reinicia o formulário a cada usuário aberto.
  return <UserFormContent key={`${props.open}-${props.employee?.cpf ?? "novo"}`} {...props} />;
}

function UserFormContent({
  employee,
  open,
  readOnly,
  currentUserCpf,
  onClose,
  onCreate,
  onUpdate,
}: UserFormDialogProps) {
  const [form, setForm] = useState<UserForm>(() => (employee ? toForm(employee) : EMPTY_FORM));
  const [step, setStep] = useState<"form" | "confirmDeactivate">("form");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  if (!open) return <AdminDialog open={false} onClose={onClose} title="" />;

  const isNew = employee === null;
  const isSeller = form.role === "employee";
  const update = (patch: Partial<UserForm>) => setForm((current) => ({ ...current, ...patch }));

  const save = async (payloadOverride?: EmployeePayload, successMessage?: string) => {
    const problem = payloadOverride ? null : validate(form, employee);
    if (problem) {
      setError(problem);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (employee) await onUpdate(employee.cpf, payloadOverride ?? toPayload(form, employee));
      else await onCreate(toPayload(form, null));
      setSavedMessage(successMessage ?? (isNew ? `Usuário ${form.name.trim()} cadastrado` : `Usuário ${form.name.trim()} atualizado`));
    } catch (saveError) {
      console.error(saveError);
      setError(saveError instanceof ApiError && saveError.message ? saveError.message : "Não foi possível salvar o usuário.");
      setStep("form");
    } finally {
      setSaving(false);
    }
  };

  if (savedMessage) {
    return (
      <AdminDialog open onClose={onClose} title="Alterações salvas">
        <SavedConfirmation result={savedMessage} onConclude={onClose} />
      </AdminDialog>
    );
  }

  const errorAlert = error && (
    <p role="alert" className="text-xs leading-[18px] text-[var(--color-error-text)]">
      {error}
    </p>
  );

  if (step === "confirmDeactivate" && employee) {
    return (
      <AdminDialog
        open
        onClose={onClose}
        title="Desativar usuário"
        description={`${employee.person.nome} perde o acesso ao painel e ao PDV. O histórico de vendas é mantido.`}
        actions={
          <>
            {errorAlert}
            <Button
              variant="action"
              size="sm"
              className={adminButtonClassName}
              loading={saving}
              onClick={() => void save({ ativo: false }, `Usuário ${employee.person.nome} desativado`)}
            >
              Desativar
            </Button>
            <Button variant="outline-neutral" size="sm" className={adminButtonClassName} onClick={() => setStep("form")}>
              Voltar
            </Button>
          </>
        }
      />
    );
  }

  const canDeactivate = !readOnly && !isNew && employee.ativo && employee.cpf !== currentUserCpf;

  return (
    <AdminDialog
      open
      onClose={onClose}
      title={isNew ? "Novo usuário" : `Usuário · ${employee.person.nome}`}
      description="Revise os dados antes de continuar."
      actions={
        <>
          {errorAlert}
          {canDeactivate && (
            <Button
              variant="outline-neutral"
              size="sm"
              className={adminButtonClassName}
              disabled={saving}
              onClick={() => setStep("confirmDeactivate")}
            >
              Desativar usuário
            </Button>
          )}
          {!readOnly && (
            <Button
              variant="action"
              size="sm"
              className={adminButtonClassName}
              loading={saving}
              onClick={() => void save()}
            >
              Salvar usuário
            </Button>
          )}
          <Button variant="outline-neutral" size="sm" className={adminButtonClassName} onClick={onClose}>
            {readOnly ? "Fechar" : "Cancelar"}
          </Button>
        </>
      }
    >
      {isNew ? (
        <AdminField label="CPF *" htmlFor="user-cpf">
          <input
            id="user-cpf"
            inputMode="numeric"
            maxLength={14}
            value={form.cpf}
            onChange={(event) => update({ cpf: maskCpf(event.target.value) })}
            placeholder="000.000.000-00"
            className={adminControlClassName}
          />
        </AdminField>
      ) : (
        <AdminField label="CPF *" value={obscureCpf(employee.cpf)} />
      )}

      {readOnly ? (
        <>
          <AdminField label="Nome completo *" value={form.name} />
          <AdminField label="E-mail *" value={form.email} />
          <AdminField label="Telefone" value={form.phone || "Não informado"} />
          <AdminField label="Perfil" value={STAFF_ROLE_LABELS[form.role]} />
          {isSeller && (
            <>
              <AdminField label="Código de vendedor" value={form.sellerCode || "—"} />
              <AdminField label="Comissão (%)" value={form.commissionRate} />
              <AdminField label="Meta de vendas (R$)" value={Number(form.salesTarget).toLocaleString("pt-BR")} />
            </>
          )}
          <AdminField label="Status" value={form.active ? "Ativo" : "Inativo"} />
        </>
      ) : (
        <>
          <AdminField label="Nome completo *" htmlFor="user-name">
            <input
              id="user-name"
              value={form.name}
              onChange={(event) => update({ name: event.target.value })}
              placeholder="Ex.: Ana Silva"
              className={adminControlClassName}
            />
          </AdminField>
          <AdminField label="E-mail *" htmlFor="user-email">
            <input
              id="user-email"
              type="email"
              value={form.email}
              onChange={(event) => update({ email: event.target.value })}
              placeholder="ana@dkfashion.com.br"
              className={adminControlClassName}
            />
          </AdminField>
          <AdminField label={isNew ? "Senha *" : "Senha"} htmlFor="user-password">
            <input
              id="user-password"
              type="password"
              autoComplete="new-password"
              value={form.password}
              onChange={(event) => update({ password: event.target.value })}
              placeholder={isNew ? "Senha de acesso" : "Deixe em branco para manter"}
              className={adminControlClassName}
            />
          </AdminField>
          <AdminField label="Telefone" htmlFor="user-phone">
            <input
              id="user-phone"
              type="tel"
              inputMode="tel"
              value={form.phone}
              onChange={(event) => update({ phone: maskPhone(event.target.value) })}
              placeholder="(61) 99999-0000"
              className={adminControlClassName}
            />
          </AdminField>
          <AdminField label="Perfil" htmlFor="user-role">
            <select
              id="user-role"
              value={form.role}
              onChange={(event) => update({ role: event.target.value as UserRole })}
              className={adminControlClassName}
            >
              {EDITABLE_ROLES.map((role) => (
                <option key={role} value={role}>
                  {STAFF_ROLE_LABELS[role]}
                </option>
              ))}
            </select>
          </AdminField>
          {isSeller && (
            <>
              <AdminField label="Código de vendedor" htmlFor="user-seller-code">
                <input
                  id="user-seller-code"
                  maxLength={20}
                  value={form.sellerCode}
                  onChange={(event) => update({ sellerCode: event.target.value.toUpperCase() })}
                  placeholder="Ex.: ANA01"
                  className={adminControlClassName}
                />
              </AdminField>
              <AdminField label="Comissão (%)" htmlFor="user-commission">
                <input
                  id="user-commission"
                  type="number"
                  min={0}
                  max={30}
                  step={0.5}
                  value={form.commissionRate}
                  onChange={(event) => update({ commissionRate: event.target.value })}
                  className={adminControlClassName}
                />
              </AdminField>
              <AdminField label="Meta de vendas (R$)" htmlFor="user-target">
                <input
                  id="user-target"
                  type="number"
                  min={0}
                  step={1000}
                  value={form.salesTarget}
                  onChange={(event) => update({ salesTarget: event.target.value })}
                  className={adminControlClassName}
                />
              </AdminField>
            </>
          )}
          <AdminField label="Status" htmlFor="user-status">
            <select
              id="user-status"
              value={form.active ? "ativo" : "inativo"}
              onChange={(event) => update({ active: event.target.value === "ativo" })}
              className={adminControlClassName}
            >
              <option value="ativo">Ativo</option>
              <option value="inativo">Inativo</option>
            </select>
          </AdminField>
        </>
      )}
    </AdminDialog>
  );
}
