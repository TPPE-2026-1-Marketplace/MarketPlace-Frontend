import { describe, expect, it, vi } from "vitest";
import { buildClientsCsv, clientsCsvFilename, downloadCsv } from "./csv";

describe("buildClientsCsv", () => {
  it("monta o cabeçalho e as linhas, escapando aspas e telefone ausente", () => {
    const csv = buildClientsCsv([
      { cpf: "111", nome: "Ana Cliente", email: "ana@dk.com", telefone: "61 9999" },
      { cpf: "222", nome: 'Bia "Aspas"', email: "bia@dk.com", telefone: null },
    ]);

    expect(csv).toBe(
      '"nome","email","telefone","cpf"\n"Ana Cliente","ana@dk.com","61 9999","111"\n"Bia ""Aspas""","bia@dk.com","","222"',
    );
  });

  it("gera só o cabeçalho quando não há clientes", () => {
    expect(buildClientsCsv([])).toBe('"nome","email","telefone","cpf"');
  });
});

describe("clientsCsvFilename", () => {
  it("usa a data informada", () => {
    expect(clientsCsvFilename(new Date("2026-11-07T12:00:00Z"))).toBe("clientes_2026-11-07.csv");
  });
});

describe("downloadCsv", () => {
  it("cria o arquivo, dispara o download e libera a URL", () => {
    // O Blob do jsdom não implementa text(): guarda o conteúdo passado ao construtor.
    const parts: string[] = [];
    vi.stubGlobal("Blob", class {
      constructor(content: string[]) {
        parts.push(content.join(""));
      }
    });
    const createObjectURL = vi.fn(() => "blob:csv");
    const revokeObjectURL = vi.fn();
    Object.assign(URL, { createObjectURL, revokeObjectURL });
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    downloadCsv("clientes.csv", "a,b");

    expect(parts[0]).toBe("a,b");
    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(click).toHaveBeenCalled();
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:csv");
    vi.unstubAllGlobals();
  });
});
