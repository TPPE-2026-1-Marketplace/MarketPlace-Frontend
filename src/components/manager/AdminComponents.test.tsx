import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import AccessNotice from "./AccessNotice";
import AdminField from "./AdminField";
import AdminPageHeader from "./AdminPageHeader";
import { ErrorState, LoadingState } from "./AdminStates";
import FilterBar from "./FilterBar";
import KpiCard, { KpiGrid } from "./KpiCard";
import NoResults from "./NoResults";
import { formatKpiCount } from "./format";

describe("componentes do painel", () => {
  it("AdminField liga o rótulo ao controle ou mostra o valor somente leitura", () => {
    render(
      <>
        <AdminField label="Rastreio" htmlFor="rastreio">
          <input id="rastreio" />
        </AdminField>
        <AdminField label="Total" value="R$ 10,00" />
      </>,
    );

    expect(screen.getByLabelText("Rastreio")).toBeInTheDocument();
    expect(screen.getByText("Total").nextElementSibling).toHaveTextContent("R$ 10,00");
  });

  it("KpiCard mostra rótulo, valor e ajuda dentro da grade", () => {
    render(
      <KpiGrid>
        <KpiCard label="Pendentes" value={formatKpiCount(8)} help="Aguardando pagamento" />
      </KpiGrid>,
    );

    expect(screen.getByText("Pendentes").nextElementSibling).toHaveTextContent("08");
    expect(screen.getByText("Aguardando pagamento")).toBeInTheDocument();
    expect(formatKpiCount(764)).toBe("764");
  });

  it("AdminPageHeader mostra título, descrição e ação opcional", () => {
    const { rerender } = render(<AdminPageHeader title="Estoque" description="Controle" action={<button>Adicionar</button>} />);

    expect(screen.getByRole("heading", { level: 1, name: "Estoque" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Adicionar" })).toBeInTheDocument();
    rerender(<AdminPageHeader title="Estoque" description="Controle" />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("FilterBar aplica ao enviar o formulário", async () => {
    const onApply = vi.fn();
    render(
      <FilterBar onApply={onApply}>
        <input aria-label="Busca" />
      </FilterBar>,
    );

    await userEvent.type(screen.getByLabelText("Busca"), "vestido{Enter}");
    await userEvent.click(screen.getByRole("button", { name: "Aplicar filtros" }));
    expect(onApply).toHaveBeenCalledTimes(2);
    expect(screen.getByRole("search")).toBeInTheDocument();
  });

  it("NoResults oferece limpar os filtros", async () => {
    const onClear = vi.fn();
    render(<NoResults onClear={onClear} />);

    expect(screen.getByRole("status")).toHaveTextContent("Nenhum resultado encontrado");
    await userEvent.click(screen.getByRole("button", { name: "Limpar filtros" }));
    expect(onClear).toHaveBeenCalled();
  });

  it("estados de carregamento e erro seguem os frames de fluxo", async () => {
    const onRetry = vi.fn();
    render(
      <>
        <LoadingState />
        <ErrorState onRetry={onRetry} />
        <AccessNotice />
      </>,
    );

    expect(screen.getByRole("status")).toHaveAttribute("aria-busy", "true");
    expect(screen.getByRole("alert")).toHaveTextContent("Falha de conexão");
    await userEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
    expect(onRetry).toHaveBeenCalled();
    expect(screen.getByText("Acesso conforme o perfil do usuário")).toBeInTheDocument();
  });
});
