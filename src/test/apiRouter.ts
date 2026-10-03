import { vi } from "vitest";

type Handler = unknown | ((path: string, body?: unknown) => unknown);

/**
 * Implementação de api.get/post/... que responde por prefixo de rota.
 * A rota mais longa que casar com o início do path vence; sem rota, rejeita.
 */
export function apiRouter(routes: Record<string, Handler>) {
  return vi.fn(async (path: string, body?: unknown) => {
    const key = Object.keys(routes)
      .filter((prefix) => path.startsWith(prefix))
      .sort((a, b) => b.length - a.length)[0];
    if (key === undefined) throw new Error(`Rota não simulada: ${path}`);
    const handler = routes[key];
    return typeof handler === "function" ? (handler as (p: string, b?: unknown) => unknown)(path, body) : handler;
  });
}

export const emptyPage = { data: [], meta: { page: 1, limit: 100, total: 0, totalPages: 1 } };
