// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { ProvedorDeToast } from "@/components/ui/Toast";
import type { LinhaDoHistorico } from "@/lib/dados/admin";
import { PainelMais } from "./PainelMais";

const acoes = vi.hoisted(() => ({
  criarCategoria: vi.fn(async () => ({ ok: true as const, dados: null })),
  salvarConfiguracoes: vi.fn(async () => ({ ok: true as const, dados: null })),
  renomearCategoria: vi.fn(async () => ({ ok: true as const, dados: null })),
  mudarCategoriaAtiva: vi.fn(async () => ({ ok: true as const, dados: null })),
}));
vi.mock("@/lib/admin/mais", () => acoes);
const historico = vi.hoisted(() => ({ paginaDoHistorico: vi.fn() }));
vi.mock("@/lib/admin/historico", () => historico);

// o jsdom não tem showModal/close
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () { this.open = true; };
  HTMLDialogElement.prototype.close = function () { this.open = false; this.dispatchEvent(new Event("close")); };
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const mudanca = (n: number, extra: Partial<LinhaDoHistorico> = {}): LinhaDoHistorico => ({
  id: `h${n}`, acao: "alterou", resumo: `Mudança ${n}`, valor: null, quem: "Ana Exemplo", quando: "2026-10-12T12:15:00Z", ...extra,
});
const PRIMEIRA = {
  total: 12,
  pagina: 1,
  itens: [
    mudanca(1, { acao: "criou", resumo: "Despesa criada: Ração para gatos de rua", valor: 120 }),
    mudanca(2, { acao: "cancelou", resumo: "Despesa cancelada: lançada em duplicidade", quem: null }),
    ...Array.from({ length: 8 }, (_, i) => mudanca(i + 3)),
  ],
};

const montar = () =>
  render(
    <ProvedorDeToast>
      <PainelMais
        categorias={[
          { id: "00000000-0000-4000-a000-000000000001", nome: "Ração", cor: "#C2477A", ativa: true },
          { id: "00000000-0000-4000-a000-000000000002", nome: "Fralda", cor: "#CFC3B4", ativa: false },
        ]}
        campanhas={[{
          id: "c", nome: "Campanha Exemplo", descricao: null, meta: null, inicio: "2026-09-01",
          aberta: true, fotoPath: null, fotoFoco: { x: 50, y: 50 }, arrecadado: 300, gasto: 120,
        }]}
        dataDesde="2026-01-01"
        avisoMeses={3}
        historico={PRIMEIRA}
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

  const linha = (nome: string) => within(document.getElementById("categorias")!).getByText(nome).closest(".arow") as HTMLElement;

  it("desativada aparece marcada, com Reativar", () => {
    montar();
    expect(within(linha("Fralda")).getByText("Desativada")).toHaveClass("chip-off");
    expect(within(linha("Fralda")).getByRole("button", { name: "Reativar" })).toBeInTheDocument();
    expect(within(linha("Ração")).queryByText("Desativada")).not.toBeInTheDocument();
  });

  it("desativar avisa que as despesas antigas continuam, com Desfazer", async () => {
    const u = userEvent.setup();
    montar();
    await u.click(within(linha("Ração")).getByRole("button", { name: "Desativar" }));
    expect(acoes.mudarCategoriaAtiva).toHaveBeenCalledWith({ id: "00000000-0000-4000-a000-000000000001", ativa: false });
    expect(await screen.findByText('Categoria "Ração" desativada. As despesas antigas continuam com ela.')).toBeInTheDocument();
    await u.click(within(screen.getByRole("status")).getByRole("button", { name: "Desfazer" }));
    expect(acoes.mudarCategoriaAtiva).toHaveBeenLastCalledWith({ id: "00000000-0000-4000-a000-000000000001", ativa: true });
  });

  it("renomear abre a janela com o nome e salva o novo", async () => {
    const u = userEvent.setup();
    montar();
    await u.click(within(linha("Ração")).getByRole("button", { name: "Renomear" }));
    const janela = screen.getByRole("dialog", { name: "Renomear categoria" });
    const campo = within(janela).getByLabelText("Nome");
    expect(campo).toHaveValue("Ração");
    await u.clear(campo);
    await u.type(campo, "Ração e petiscos");
    await u.click(within(janela).getByRole("button", { name: "Salvar nome" }));
    expect(acoes.renomearCategoria).toHaveBeenCalledWith({ id: "00000000-0000-4000-a000-000000000001", nome: "Ração e petiscos" });
    expect(await screen.findByText('Categoria renomeada para "Ração e petiscos".')).toBeInTheDocument();
  });

  it("renomear com o mesmo nome não grava", async () => {
    const u = userEvent.setup();
    montar();
    await u.click(within(linha("Ração")).getByRole("button", { name: "Renomear" }));
    await u.click(screen.getByRole("button", { name: "Salvar nome" }));
    expect(acoes.renomearCategoria).not.toHaveBeenCalled();
  });

  it("exportar: um link de download para cada planilha", () => {
    montar();
    const sec = within(document.getElementById("exportar")!);
    expect(sec.getByRole("link", { name: "Doações (planilha)" })).toHaveAttribute("href", "/admin/exportar/doacoes");
    expect(sec.getByRole("link", { name: "Despesas (planilha)" })).toHaveAttribute("href", "/admin/exportar/despesas");
    expect(sec.getByRole("link", { name: "Pets (planilha)" })).toHaveAttribute("href", "/admin/exportar/pets");
    expect(sec.getByRole("link", { name: "Membros (planilha)" })).toHaveAttribute("download");
  });

  it("histórico: o que mudou, valor, quem e quando, de 10 em 10", async () => {
    const u = userEvent.setup();
    historico.paginaDoHistorico.mockResolvedValueOnce({
      ok: true, dados: { total: 12, pagina: 2, itens: [mudanca(11, { resumo: "Pet cadastrado: Mel" }), mudanca(12)] },
    });
    montar();
    const sec = within(document.getElementById("auditoria")!);
    expect(sec.getByText("12 alterações · mostrando 1–10")).toBeInTheDocument();
    const criada = sec.getByText("Despesa criada: Ração para gatos de rua").closest(".arow") as HTMLElement;
    expect(within(criada).getByText("+")).toBeInTheDocument();
    expect(within(criada).getByText(/^R\$ 120,00 · Ana Exemplo · /)).toBeInTheDocument();
    // feita fora do site (sem administrador): só o quando
    const cancelada = sec.getByText("Despesa cancelada: lançada em duplicidade").closest(".arow") as HTMLElement;
    expect(within(cancelada).getByText("×")).toBeInTheDocument();
    expect(within(cancelada).queryByText(/Ana/)).not.toBeInTheDocument();

    await u.click(sec.getByRole("button", { name: "Página 2 de 2" }));
    expect(historico.paginaDoHistorico).toHaveBeenCalledWith({ pagina: 2 });
    expect(await sec.findByText("Pet cadastrado: Mel")).toBeInTheDocument();
    expect(sec.getByText("12 alterações · mostrando 11–12")).toBeInTheDocument();
    await u.click(sec.getByRole("button", { name: "Página 1 de 2" }));
    expect(sec.getByText("Despesa criada: Ração para gatos de rua")).toBeInTheDocument();
  });
});
