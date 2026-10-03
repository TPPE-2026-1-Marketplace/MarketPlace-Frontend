import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api, ApiError } from "./api";

const BASE = "http://localhost:3001/api";

function jsonResponse(body: unknown, status = 200) {
  return new Response(status === 204 ? null : JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("api", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("faz GET na URL base e ignora parâmetros vazios", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ ok: true }));

    const result = await api.get("/products", { page: 2, busca: "", categoria: undefined });

    expect(result).toEqual({ ok: true });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`${BASE}/products?page=2`);
    expect(init.method).toBe("GET");
    expect(init.headers["Content-Type"]).toBe("application/json");
    expect(init.headers.Authorization).toBeUndefined();
    expect(init.body).toBeUndefined();
  });

  it("envia o token salvo no localStorage", async () => {
    localStorage.setItem("dk_token", "abc");
    fetchMock.mockResolvedValue(jsonResponse({}));

    await api.get("/orders");

    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe("Bearer abc");
  });

  it("serializa o corpo em JSON no POST, PATCH e PUT", async () => {
    fetchMock.mockImplementation(() => Promise.resolve(jsonResponse({ id: 1 })));

    await api.post("/a", { x: 1 });
    await api.patch("/b", { y: 2 });
    await api.put("/c", { z: 3 });

    expect(fetchMock.mock.calls.map(([, init]) => [init.method, init.body])).toEqual([
      ["POST", '{"x":1}'],
      ["PATCH", '{"y":2}'],
      ["PUT", '{"z":3}'],
    ]);
  });

  it("repassa FormData sem Content-Type para o fetch calcular o boundary", async () => {
    fetchMock.mockResolvedValue(jsonResponse({}));
    const form = new FormData();
    form.append("file", "conteudo");

    await api.post("/upload", form, { headers: { "Content-Type": "multipart/form-data" } });

    const [, init] = fetchMock.mock.calls[0];
    expect(init.body).toBe(form);
    expect(init.headers["Content-Type"]).toBeUndefined();
  });

  it("retorna undefined em 204 No Content", async () => {
    fetchMock.mockResolvedValue(jsonResponse(null, 204));

    await expect(api.delete("/products/1")).resolves.toBeUndefined();
    expect(fetchMock.mock.calls[0][1].method).toBe("DELETE");
  });

  it("lança ApiError com a mensagem do backend", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ message: "Não autorizado" }, 401));

    const error = (await api.get("/me").catch((e) => e)) as ApiError;

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ name: "ApiError", status: 401, message: "Não autorizado" });
    expect(error.data).toEqual({ message: "Não autorizado" });
  });

  it("usa mensagem padrão quando o erro não tem corpo JSON", async () => {
    fetchMock.mockResolvedValue(new Response("falha", { status: 500 }));

    await expect(api.get("/x")).rejects.toThrow("Request failed with status 500");
  });
});
