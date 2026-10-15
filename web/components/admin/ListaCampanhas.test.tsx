// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { ProvedorDeToast } from "@/components/ui/Toast";
import type { CampanhaDoAdmin } from "@/lib/dados/admin";
import { ListaCampanhas } from "./ListaCampanhas";

const acoes = vi.hoisted(() => ({
  salvarCampanha: vi.fn(async () => ({ ok: true as const, dados: null })),
  mudarSituacao: vi.fn(async () => ({ ok: true as const, dados: null })),
}));
vi.mock("@/lib/admin/campanhas", () => acoes);

// o jsdom não tem showModal/close
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () { this.open = true; };
  HTMLDialogElement.prototype.close = function () { this.open = false; this.dispatchEvent(new Event("close")); };
});
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const CAMPANHAS: CampanhaDoAdmin[] = [
  { id: "s", nome: "Campanha Stuart (exemplo)", descricao: "Tratamento do Stuart.", meta: 2000, inicio: "2026-08-10", aberta: true, arrecadado: 1200, gasto: 980 },
  { id: "n", nome: "Campanha Nelson (exemplo)", descricao: null, meta: null, inicio: "2026-03-02", aberta: false, arrecadado: 640, gasto: 640 },
];

const montar = () =>
  render(
    <ProvedorDeToast>
      <ListaCampanhas campanhas={CAMPANHAS} />
    </ProvedorDeToast>,
  );

const cartao = (nome: string) => screen.getByRole("heading", { name: nome }).closest("article") as HTMLElement;

describe("ListaCampanhas", () => {
  it("mostra meta, progresso e saldo", () => {
    montar();
    const stuart = cartao("Campanha Stuart (exemplo)");
    expect(within(stuart).getByText("arrecadado de R$ 2.000,00 (60% da meta)")).toBeInTheDocument();
    expect(within(stuart).getByRole("img", { name: "60% da meta" })).toBeInTheDocument();
    expect(within(stuart).getByText("R$ 220,00")).toBeInTheDocument();
    const nelson = cartao("Campanha Nelson (exemplo)");
    expect(within(nelson).queryByRole("img")).not.toBeInTheDocument();
    expect(within(nelson).getByText("Encerrada")).toHaveClass("chip-off");
  });

  it("filtra as encerradas", async () => {
    const u = userEvent.setup();
    montar();
    await u.click(screen.getByRole("button", { name: "Encerradas1" }));
    expect(screen.queryByRole("heading", { name: "Campanha Stuart (exemplo)" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Campanha Nelson (exemplo)" })).toBeInTheDocument();
  });

  it("editar abre a janela preenchida e salva", async () => {
    const u = userEvent.setup();
    montar();
    await u.click(within(cartao("Campanha Stuart (exemplo)")).getByRole("button", { name: "Editar" }));
    const janela = screen.getByRole("dialog", { name: "Editar campanha" });
    expect(within(janela).getByLabelText("Meta (opcional)")).toHaveValue("2000");
    await u.clear(within(janela).getByLabelText("Meta (opcional)"));
    await u.click(within(janela).getByRole("button", { name: "Salvar campanha" }));
    expect(acoes.salvarCampanha).toHaveBeenCalledWith({
      id: "s", nome: "Campanha Stuart (exemplo)", descricao: "Tratamento do Stuart.", meta: null, inicio: "2026-08-10", situacao: "em_andamento",
    });
    expect(await screen.findByText("Campanha atualizada.")).toBeInTheDocument();
  });

  it("encerrar tem Desfazer", async () => {
    const u = userEvent.setup();
    montar();
    await u.click(within(cartao("Campanha Stuart (exemplo)")).getByRole("button", { name: "Encerrar campanha" }));
    expect(acoes.mudarSituacao).toHaveBeenCalledWith({ id: "s", situacao: "encerrada" });
    expect(await screen.findByText("Campanha Stuart (exemplo) foi encerrada.")).toBeInTheDocument();
    await u.click(within(screen.getByRole("status")).getByRole("button", { name: "Desfazer" }));
    expect(acoes.mudarSituacao).toHaveBeenLastCalledWith({ id: "s", situacao: "em_andamento" });
  });
});
