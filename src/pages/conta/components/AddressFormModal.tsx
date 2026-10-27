import * as DialogPrimitive from "@radix-ui/react-dialog";
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import type { Address, AddressFormValues } from "@/hooks/useAddresses";
import { maskCep, onlyDigits } from "@/lib/utils";

interface AddressFormModalProps {
  open: boolean;
  address: Address | null;
  saving: boolean;
  onClose: () => void;
  onSubmit: (values: AddressFormValues) => void;
}

const EMPTY_FORM: AddressFormValues = {
  nome: "",
  cep: "",
  logradouro: "",
  numero: "",
  complemento: "",
  bairro: "",
  cidade: "",
  uf: "",
};

export default function AddressFormModal({ open, address, saving, onClose, onSubmit }: AddressFormModalProps) {
  const [form, setForm] = useState<AddressFormValues>(EMPTY_FORM);

  useEffect(() => {
    if (!open) return;
    setForm(
      address
        ? {
            nome: address.nome ?? "",
            cep: maskCep(address.cep),
            logradouro: address.logradouro,
            numero: address.numero,
            complemento: address.complemento ?? "",
            bairro: address.bairro,
            cidade: address.cidade,
            uf: address.uf,
          }
        : EMPTY_FORM,
    );
  }, [open, address]);

  const isValid =
    form.cep.replace(/\D/g, "").length === 8 &&
    form.logradouro.trim() &&
    form.numero.trim() &&
    form.bairro.trim() &&
    form.cidade.trim() &&
    form.uf.trim().length === 2;

  return (
    <DialogPrimitive.Root open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-[var(--overlay)]" />
        <DialogPrimitive.Content className="fixed top-1/2 left-1/2 z-50 flex max-h-[90vh] w-[calc(100%-32px)] max-w-[560px] -translate-x-1/2 -translate-y-1/2 flex-col gap-4 overflow-y-auto rounded-[var(--radius-lg)] bg-[var(--background-card)] p-6 shadow-lg focus:outline-none">
          <div className="flex items-center gap-3">
            <DialogPrimitive.Title className="flex-1 text-xl leading-7 font-semibold text-[var(--foreground)]">
              {address ? "Editar endereço" : "Adicionar endereço"}
            </DialogPrimitive.Title>
            <DialogPrimitive.Close
              aria-label="Fechar"
              className="flex size-11 items-center justify-center rounded-[var(--radius-md)] border border-[var(--border-control)] text-[var(--foreground)] hover:bg-[var(--background-secondary)]"
            >
              <X className="size-4" aria-hidden="true" />
            </DialogPrimitive.Close>
          </div>
          <DialogPrimitive.Description className="sr-only">
            Formulário de endereço de entrega.
          </DialogPrimitive.Description>

          <Input
            label="Nome do endereço"
            placeholder="Casa"
            value={form.nome}
            onChange={(e) => setForm((prev) => ({ ...prev, nome: e.target.value }))}
          />
          <Input
            label="CEP"
            placeholder="70000-000"
            inputMode="numeric"
            value={form.cep}
            onChange={(e) => setForm((prev) => ({ ...prev, cep: maskCep(e.target.value) }))}
          />
          <Input
            label="Rua"
            placeholder="Rua das Flores"
            value={form.logradouro}
            onChange={(e) => setForm((prev) => ({ ...prev, logradouro: e.target.value }))}
          />
          <div className="flex gap-4">
            <Input
              label="Número"
              placeholder="120"
              value={form.numero}
              onChange={(e) => setForm((prev) => ({ ...prev, numero: e.target.value }))}
              containerClassName="flex-1"
            />
            <Input
              label="Complemento"
              placeholder="Apto 302"
              value={form.complemento}
              onChange={(e) => setForm((prev) => ({ ...prev, complemento: e.target.value }))}
              containerClassName="flex-1"
            />
          </div>
          <Input
            label="Bairro"
            placeholder="Asa Norte"
            value={form.bairro}
            onChange={(e) => setForm((prev) => ({ ...prev, bairro: e.target.value }))}
          />
          <div className="flex gap-4">
            <Input
              label="Cidade"
              placeholder="Brasília"
              value={form.cidade}
              onChange={(e) => setForm((prev) => ({ ...prev, cidade: e.target.value }))}
              containerClassName="flex-1"
            />
            <Input
              label="UF"
              placeholder="DF"
              maxLength={2}
              value={form.uf}
              onChange={(e) => setForm((prev) => ({ ...prev, uf: e.target.value.toUpperCase() }))}
              containerClassName="w-20"
            />
          </div>

          <Button
            variant="action"
            size="touch"
            fullWidth
            disabled={!isValid}
            loading={saving}
            onClick={() =>
              onSubmit({
                ...form,
                nome: form.nome?.trim() || undefined,
                cep: onlyDigits(form.cep),
                uf: form.uf.trim().toUpperCase(),
              })
            }
          >
            Salvar endereço
          </Button>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
