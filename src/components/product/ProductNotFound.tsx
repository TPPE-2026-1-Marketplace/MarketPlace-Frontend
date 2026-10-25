import React from "react";
import { Link } from "react-router-dom";
import { ShoppingBag } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";
import { buttonClassName } from "@/components/ui/button-variants";

export function ProductNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)] px-4">
      <EmptyState
        icon={<ShoppingBag className="size-8 text-[var(--color-brand)]" />}
        title="Produto não encontrado"
        body="O produto que você está procurando pode ter sido removido ou está temporariamente indisponível."
        action={
          <Link
            to="/produtos"
            className={buttonClassName({ variant: "action", size: "md" })}
          >
            Voltar para a loja
          </Link>
        }
      />
    </div>
  );
}
