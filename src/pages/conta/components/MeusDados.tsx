import { Edit2, Save, X } from "lucide-react";
import Button from "@/components/ui/Button";
import { Card } from "@/components/ui/card";
import Input from "@/components/ui/Input";

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
}

const FIELDS: Array<{ label: string; key: keyof MeusDadosForm; type: string }> = [
  { label: "Nome", key: "name", type: "text" },
  { label: "E-mail", key: "email", type: "email" },
  { label: "Telefone", key: "telefone", type: "tel" },
  { label: "CPF", key: "cpf", type: "text" },
];

const DISPLAY_ROWS = (
  displayName: string,
  displayEmail: string,
  displayPhone: string,
  displayCpf: string,
): Array<[string, string]> => [
  ["Nome", displayName],
  ["E-mail", displayEmail],
  ["Telefone", displayPhone || "Não informado"],
  ["CPF", displayCpf ? `***.***.***-${displayCpf.slice(-2)}` : "Não informado"],
];

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
}: MeusDadosProps) {
  return (
    <Card className="gap-5 rounded-none border-[var(--border)] p-6">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-xl text-gray-900">Meus Dados</h2>
        {!isEditing ? (
          <button
            onClick={onEdit}
            className="flex items-center gap-1 text-sm text-gray-500 transition-colors hover:text-gray-800"
          >
            <Edit2 className="w-4 h-4" /> Editar
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={onCancel}
              className="flex items-center gap-1 text-sm text-gray-500 transition-colors hover:text-gray-800"
            >
              <X className="w-4 h-4" /> Cancelar
            </button>
            <Button onClick={onSave} disabled={saving} loading={saving} size="sm" className="gap-1">
              {!saving && <Save className="w-4 h-4" />}
              Salvar
            </Button>
          </div>
        )}
      </div>

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
        <div className="space-y-4">
          {FIELDS.map((field) => (
            <Input
              key={field.key}
              label={field.label}
              type={field.type}
              inputMode={field.key === "telefone" ? "tel" : undefined}
              disabled={field.key === "cpf"}
              value={form[field.key]}
              error={field.key === "telefone" ? (telefoneError ?? undefined) : undefined}
              onChange={(e) => onFieldChange(field.key, e.target.value)}
              placeholder={`Informe seu ${field.label.toLowerCase()}`}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-1">
          {DISPLAY_ROWS(displayName, displayEmail, displayPhone, displayCpf).map(([label, value]) => (
            <div key={label} className="flex gap-4 border-b border-gray-50 py-3 last:border-0">
              <span className="w-36 shrink-0 text-sm text-gray-400">{label}</span>
              <span className="text-sm text-gray-900">{value || "Não informado"}</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
