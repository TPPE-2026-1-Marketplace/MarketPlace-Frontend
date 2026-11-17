import { useState } from "react";
import { MapPin } from "lucide-react";
import Badge from "@/components/ui/Badge";
import { buttonClassName } from "@/components/ui/button-variants";
import EmptyState from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { useAddresses, type Address, type AddressFormValues } from "@/hooks/useAddresses";
import { maskCep } from "@/lib/utils";
import AddressFormModal from "./AddressFormModal";

export default function MeusEnderecos() {
  const { addresses, isLoading, createAddress, updateAddress, removeAddress } = useAddresses();
  const [editing, setEditing] = useState<Address | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const openNew = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (address: Address) => {
    setEditing(address);
    setModalOpen(true);
  };

  const handleSubmit = async (values: AddressFormValues) => {
    setSaving(true);
    try {
      if (editing) {
        await updateAddress(editing.id, values);
      } else {
        await createAddress(values);
      }
      setModalOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (address: Address) => {
    if (!confirm(`Remover o endereço "${address.nome ?? "sem nome"}"?`)) return;
    await removeAddress(address.id);
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-xl font-semibold text-[var(--foreground)]">Meus endereços</h2>
        <p className="mt-1 text-sm text-[var(--foreground-secondary)]">
          Escolha onde deseja receber suas próximas compras.
        </p>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-4">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-40 rounded-[var(--radius-lg)]" />
          ))}
        </div>
      ) : addresses.length === 0 ? (
        <EmptyState icon={<MapPin className="size-7" />} title="Nenhum endereço cadastrado" />
      ) : (
        <div className="flex flex-col gap-4">
          {addresses.map((address) => (
            <div
              key={address.id}
              className="flex flex-col gap-4 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--background-card)] p-6"
            >
              <div className="flex items-center gap-3">
                <p className="text-sm font-semibold text-[var(--foreground)]">
                  {address.nome || "Endereço"}
                </p>
                {address.principal && <Badge variant="brand">Principal</Badge>}
              </div>
              <div className="text-sm text-[var(--foreground-secondary)]">
                <p>
                  {address.logradouro}, {address.numero}
                  {address.complemento ? ` · ${address.complemento}` : ""}
                </p>
                <p>
                  {address.bairro} · {address.cidade}, {address.uf}
                </p>
                <p>CEP {maskCep(address.cep)}</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => openEdit(address)} className={buttonClassName({ variant: "outline-neutral" })}>
                  Editar endereço
                </button>
                <button
                  onClick={() => handleRemove(address)}
                  className="text-sm text-[var(--color-error-text)] hover:underline"
                >
                  Remover
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <button onClick={openNew} className={buttonClassName({ variant: "outline-neutral", className: "self-start" })}>
        Adicionar endereço
      </button>

      <AddressFormModal
        open={modalOpen}
        address={editing}
        saving={saving}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
