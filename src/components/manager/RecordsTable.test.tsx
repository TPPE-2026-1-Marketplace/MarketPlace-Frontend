import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import RecordsTable, { type RecordColumn } from "./RecordsTable";

interface Item {
  id: number;
  name: string;
}

const columns: RecordColumn<Item>[] = [
  { key: "id", header: "Código", primary: true, render: (item) => `#${item.id}` },
  { key: "name", header: "Nome", render: (item) => item.name },
  { key: "acao", header: "Ação", hideMobileLabel: true, render: (item) => <button>Abrir {item.id}</button> },
];

const items = Array.from({ length: 12 }, (_, index) => ({ id: index + 1, name: `Item ${index + 1}` }));

function renderTable(rows = items, pageSize = 5) {
  render(<RecordsTable title="Registros recentes" columns={columns} rows={rows} getRowKey={(item) => item.id} pageSize={pageSize} />);
}

describe("RecordsTable", () => {
  it("mostra título, cabeçalhos e rótulos do card mobile", () => {
    renderTable(items.slice(0, 2));

    expect(screen.getByRole("heading", { name: "Registros recentes" })).toBeInTheDocument();
    expect(screen.getAllByRole("columnheader").map((th) => th.textContent)).toEqual(["Código", "Nome", "Ação"]);
    const [firstCell, , actionCell] = within(screen.getAllByRole("row")[1]).getAllByRole("cell");
    expect(firstCell).toHaveTextContent("Código: #1");
    expect(firstCell).toHaveClass("text-[var(--foreground)]");
    expect(actionCell).toHaveTextContent(/^Abrir 1$/);
    expect(screen.getByText("Exibindo 2 registros")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Anterior" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Próxima" })).toBeDisabled();
  });

  it("pagina os registros com Anterior e Próxima", async () => {
    renderTable();

    expect(screen.getAllByRole("row")).toHaveLength(6);
    expect(screen.getByText("Exibindo 1–5 de 12 registros")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Próxima" }));
    await userEvent.click(screen.getByRole("button", { name: "Próxima" }));
    expect(screen.getByText("Exibindo 11–12 de 12 registros")).toBeInTheDocument();
    expect(screen.getByText("#12")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Próxima" })).toBeDisabled();
    await userEvent.click(screen.getByRole("button", { name: "Anterior" }));
    expect(screen.getByText("Exibindo 6–10 de 12 registros")).toBeInTheDocument();
  });

  it("singulariza a contagem de um registro", () => {
    renderTable(items.slice(0, 1));

    expect(screen.getByText("Exibindo 1 registro")).toBeInTheDocument();
  });
});
