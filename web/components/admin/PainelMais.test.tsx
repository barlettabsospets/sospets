// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ProvedorDeToast } from "@/components/ui/Toast";
import { PainelMais } from "./PainelMais";

const acoes = vi.hoisted(() => ({
  criarCategoria: vi.fn(async () => ({ ok: true as const, dados: null })),
  salvarConfiguracoes: vi.fn(async () => ({ ok: true as const, dados: null })),
}));
vi.mock("@/lib/admin/mais", () => acoes);

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const montar = () =>
  render(
    <ProvedorDeToast>
      <PainelMais
        categorias={[{ id: "1", nome: "Ração", cor: "#C2477A" }, { id: "2", nome: "Outros", cor: "#CFC3B4" }]}
        campanhas={[{
          id: "c", nome: "Campanha Exemplo", descricao: null, meta: null, inicio: "2026-09-01",
          aberta: true, fotoPath: null, arrecadado: 300, gasto: 120,
        }]}
        dataDesde="2026-01-01"
        avisoMeses={3}
      />
    </ProvedorDeToast>,
  );

describe("PainelMais", () => {
  it("lista categorias e campanhas", () => {
    montar();
    const cats = within(document.getElementById("categorias")!);
    expect(cats.getByText("Ração")).toBeInTheDocument();
    expect(screen.getByText("R$ 300,00 arrecadados · R$ 120,00 gastos")).toBeInTheDocument();
    expect(screen.getByText("Em andamento")).toHaveClass("chip-ok");
  });

  it("Enter no campo adiciona a categoria e limpa o campo", async () => {
    const u = userEvent.setup();
    montar();
    await u.type(screen.getByLabelText("Nova categoria"), "Taxas e cartório{Enter}");
    expect(acoes.criarCategoria).toHaveBeenCalledWith({ nome: "Taxas e cartório" });
    expect(await screen.findByText('Categoria "Taxas e cartório" criada.')).toBeInTheDocument();
    expect(screen.getByLabelText("Nova categoria")).toHaveValue("");
  });

  it("campo vazio não grava", async () => {
    const u = userEvent.setup();
    montar();
    await u.click(screen.getByRole("button", { name: "Adicionar" }));
    expect(acoes.criarCategoria).not.toHaveBeenCalled();
  });

  it("salva as configurações", async () => {
    const u = userEvent.setup();
    montar();
    expect(screen.getByLabelText("Avisar quando alguém ficar sem contribuir por")).toHaveValue("3");
    await u.selectOptions(screen.getByLabelText("Avisar quando alguém ficar sem contribuir por"), "6 meses");
    await u.click(screen.getByRole("button", { name: "Salvar configurações" }));
    expect(acoes.salvarConfiguracoes).toHaveBeenCalledWith({ dadosDesde: "2026-01-01", avisoMeses: 6 });
    expect(await screen.findByText("Configurações salvas.")).toBeInTheDocument();
  });
});
