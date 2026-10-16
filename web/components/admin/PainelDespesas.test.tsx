// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { ProvedorDeToast } from "@/components/ui/Toast";
import type { Categoria, DespesaDoAdmin } from "@/lib/dados/admin";
import { PainelDespesas } from "./PainelDespesas";

const acoes = vi.hoisted(() => ({
  salvarDespesa: vi.fn(async () => ({ ok: true as const, dados: null })),
  cancelarDespesa: vi.fn(async () => ({ ok: true as const, dados: null })),
}));
vi.mock("@/lib/admin/despesas", () => acoes);

// o jsdom não tem showModal/close
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () { this.open = true; };
  HTMLDialogElement.prototype.close = function () { this.open = false; this.dispatchEvent(new Event("close")); };
});
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const RACAO = "00000000-0000-4000-a000-0000000000a1";
const VACINAS = "00000000-0000-4000-a000-0000000000a2";
const CATEGORIAS: Categoria[] = [
  { id: RACAO, nome: "Ração", cor: "#C2477A", ativa: true },
  { id: VACINAS, nome: "Vacinas", cor: "#7A5BA6", ativa: false },
];
const d = (id: string, descricao: string, valor: number, categoria: Categoria, extra: Partial<DespesaDoAdmin> = {}): DespesaDoAdmin => ({
  id, descricao, valor, data: "2026-10-06", categoriaId: categoria.id, categoria: categoria.nome, cor: categoria.cor,
  petId: null, pet: null, especie: null, campanhaId: null, ...extra,
});
const DESPESAS = [
  d("00000000-0000-4000-a000-000000000001", "Ração para gatos de rua", 120, CATEGORIAS[0]),
  d("00000000-0000-4000-a000-000000000002", "Vacina V4", 24, CATEGORIAS[1], { data: "2026-10-03", pet: "Mel", petId: "00000000-0000-4000-a000-0000000000b1", especie: "gato" }),
];

const montar = () =>
  render(
    <ProvedorDeToast>
      <PainelDespesas
        despesas={DESPESAS}
        categorias={CATEGORIAS}
        pets={[{ id: "00000000-0000-4000-a000-0000000000b1", nome: "Mel" }]}
        campanhas={[]}
        mesAtual="2026-10"
        dadosDesde="2026-09"
      />
    </ProvedorDeToast>,
  );

describe("PainelDespesas", () => {
  it("total e quantidade do mês", () => {
    montar();
    expect(screen.getByText("R$ 144,00")).toBeInTheDocument();
    expect(screen.getByText("2 despesas")).toBeInTheDocument();
  });

  it("Por categoria filtra a lista, e Limpar filtro volta", async () => {
    const u = userEvent.setup();
    montar();
    const ul = screen.getByRole("list", { name: "Por categoria" });
    await u.click(within(ul).getByRole("button", { name: /Vacinas/ }));
    expect(within(ul).getByRole("button", { name: /Vacinas/ })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("1 despesa de vacinas em outubro")).toBeInTheDocument();
    await u.click(screen.getByRole("button", { name: "Limpar filtro" }));
    expect(screen.getByText("2 despesas em outubro")).toBeInTheDocument();
  });

  it("nova despesa: sem descrição ou valor não salva e põe o foco no campo", async () => {
    const u = userEvent.setup();
    montar();
    await u.click(screen.getByRole("button", { name: "Nova despesa" }));
    const janela = screen.getByRole("dialog", { name: "Nova despesa" });
    await u.click(within(janela).getByRole("button", { name: "Salvar despesa" }));
    expect(within(janela).getByLabelText("O que foi comprado ou pago?")).toHaveFocus();
    await u.type(within(janela).getByLabelText("O que foi comprado ou pago?"), "Areia");
    await u.click(within(janela).getByRole("button", { name: "Salvar despesa" }));
    expect(within(janela).getByLabelText("Valor")).toHaveFocus();
    expect(acoes.salvarDespesa).not.toHaveBeenCalled();
  });

  it("nova despesa não oferece categoria desativada; a antiga continua com ela", async () => {
    const u = userEvent.setup();
    montar();
    await u.click(screen.getByRole("button", { name: "Nova despesa" }));
    expect(screen.queryByRole("option", { name: "Vacinas", hidden: true })).not.toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Ração", hidden: true })).toBeInTheDocument();
    await u.click(screen.getAllByRole("button", { name: "Fechar" })[1]);
    await u.click(screen.getByRole("button", { name: "Editar Vacina V4" }));
    expect(screen.getByRole("option", { name: "Vacinas", hidden: true })).toHaveAttribute("aria-selected", "true");
  });

  it("salva a nova despesa com os campos do formulário", async () => {
    const u = userEvent.setup();
    montar();
    await u.click(screen.getByRole("button", { name: "Nova despesa" }));
    const janela = screen.getByRole("dialog", { name: "Nova despesa" });
    await u.type(within(janela).getByLabelText("O que foi comprado ou pago?"), "Areia");
    await u.type(within(janela).getByLabelText("Valor"), "35,90");
    await u.selectOptions(within(janela).getByLabelText("Pet (opcional)"), "Mel");
    await u.click(within(janela).getByRole("button", { name: "Salvar despesa" }));
    expect(acoes.salvarDespesa).toHaveBeenCalledWith(expect.objectContaining({
      descricao: "Areia", valor: 35.9, categoriaId: RACAO, petId: "00000000-0000-4000-a000-0000000000b1", campanhaId: null,
    }));
    expect(await screen.findByText("Despesa de R$ 35,90 registrada.")).toBeInTheDocument();
  });

  it("cancelar pede o motivo e tem Desfazer", async () => {
    const u = userEvent.setup();
    montar();
    await u.click(screen.getByRole("button", { name: "Editar Ração para gatos de rua" }));
    await u.click(screen.getByRole("button", { name: "Cancelar despesa" }));
    const janela = screen.getByRole("dialog", { name: "Cancelar despesa" });
    expect(within(janela).getByText("Ração para gatos de rua (R$ 120,00)")).toBeInTheDocument();
    await u.type(within(janela).getByLabelText("Motivo"), "valor errado");
    await u.click(within(janela).getByRole("button", { name: "Cancelar despesa" }));
    expect(acoes.cancelarDespesa).toHaveBeenCalledWith({ id: "00000000-0000-4000-a000-000000000001", motivo: "valor errado" });
    expect(await screen.findByText("Despesa cancelada. Ela saiu da lista e do total do mês.")).toBeInTheDocument();
    await u.click(within(screen.getByRole("status")).getByRole("button", { name: "Desfazer" }));
    expect(acoes.cancelarDespesa).toHaveBeenLastCalledWith({ id: "00000000-0000-4000-a000-000000000001", motivo: null });
  });
});
