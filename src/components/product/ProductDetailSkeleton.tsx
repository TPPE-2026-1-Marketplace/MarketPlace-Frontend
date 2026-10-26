import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export function ProductDetailSkeleton() {
  return (
    <div className="min-h-screen bg-[var(--background)] py-8 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Spinner para feedback imediato e compatibilidade com testes */}
        <div className="flex items-center justify-center py-4">
          <div className="w-8 h-8 rounded-full border-2 border-[var(--border)] border-t-[var(--action-primary)] animate-spin" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 mt-6">
          {/* Skeleton da Galeria */}
          <div className="flex gap-4">
            <div className="hidden lg:flex flex-col gap-3 w-16 shrink-0">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="w-16 h-20 rounded-[var(--radius-sm)]" />
              ))}
            </div>
            <div className="flex-1 aspect-[3/4] rounded-[var(--radius-lg)]">
              <Skeleton className="w-full h-full rounded-[var(--radius-lg)]" />
            </div>
          </div>

          {/* Skeleton das Informações de Compra */}
          <div className="space-y-6">
            <Skeleton className="h-6 w-32 rounded-[var(--radius-full)]" />
            <Skeleton className="h-10 w-3/4 rounded-[var(--radius-md)]" />
            <Skeleton className="h-4 w-40 rounded-[var(--radius-sm)]" />
            <Skeleton className="h-8 w-48 rounded-[var(--radius-md)]" />

            <div className="space-y-3 pt-4 border-t border-[var(--border)]">
              <Skeleton className="h-4 w-24" />
              <div className="flex gap-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-9 w-20 rounded-[var(--radius-sm)]" />
                ))}
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-[var(--border)]">
              <Skeleton className="h-4 w-28" />
              <div className="flex gap-2">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="size-11 rounded-[var(--radius-sm)]" />
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-6">
              <Skeleton className="h-12 flex-1 rounded-[var(--radius-md)]" />
              <Skeleton className="h-12 flex-1 rounded-[var(--radius-md)]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
