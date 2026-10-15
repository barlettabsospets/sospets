// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { ProvedorDeToast } from "@/components/ui/Toast";
import type { Contribuicao } from "@/lib/dominio/contribuicoes";
import type { Membro } from "@/lib/dominio/membros";
import { PainelContribuicoes } from "./PainelContribuicoes";

const acoes = vi.hoisted(() => ({
  registrarContribuicao: vi.fn(async () => ({ ok: true as const, dados: "nova" })),
  desfazerContribuicao: vi.fn(async () => ({ ok: true as const, dados: null })),
  registrarAvulsa: vi.fn(async () => ({ ok: true as const, dados: null })),
}));
vi.mock("@/lib/admin/contribuicoes", () => acoes);

// o jsdom não tem showModal/close
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () { this.open = true; };
  HTMLDialogElement.prototype.close = function () { this.open = false; this.dispatchEvent(new Event("close")); };
});
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const MEMBROS: Membro[] = [
  { id: "a", nome: "Ana Exemplo", valorMensal: null, ativo: true },
  { id: "b", nome: "Bruno Teste", valorMensal: 30, ativo: true },
  { id: "c", nome: "Carla Modelo", valorMensal: null, ativo: true },
  { id: "y", nome: "Yara Modelo", valorMensal: null, ativo: false },
];
const c = (id: string, membroId: string | null, competencia: string, valor = 20): Contribuicao =>
  ({ id, membroId, competencia: competencia as Contribuicao["competencia"], valor, registradaEm: `${competencia}-07` });
const CONTRIBUICOES = [c("1", "a", "2026-10"), c("2", "c", "2026-09"), c("3", null, "2026-10", 50)];

const montar = () =>
  render(
    <ProvedorDeToast>
      <PainelContribuicoes
        membros={MEMBROS}
        contribuicoes={CONTRIBUICOES}
        campanhas={[{ id: "00000000-0000-4000-a000-0000000000c1", nome: "Campanha Exemplo" }]}
        mesAtual="2026-10"
        dadosDesde="2026-08"
        padrao={20}
      />
    </ProvedorDeToast>,
  );

describe("PainelContribuicoes", () => {
  it("resume o mês: inativos fora, avulsas no arrecadado", () => {
    montar();
    expect(screen.getByText("Faltam 2 membros contribuir")).toBeInTheDocument();
    expect(screen.getByText("R$ 70,00")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Faltam contribuir2" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.queryByText("Yara Modelo")).not.toBeInTheDocument();
  });

  it("sugere o valor do membro e mostra a nota", () => {
    montar();
    expect(screen.getByLabelText("Valor de Bruno Teste")).toHaveValue("30,00");
    const carla = screen.getByText("Carla Modelo").closest(".row") as HTMLElement;
    expect(within(carla).getByText("Contribuiu no mês anterior")).toBeInTheDocument();
  });

  it("Contribuiu grava o valor digitado, e o Desfazer do aviso cancela", async () => {
    const u = userEvent.setup();
    montar();
    const campo = screen.getByLabelText("Valor de Carla Modelo");
    await u.clear(campo);
    await u.type(campo, "25,50");
    const carla = screen.getByText("Carla Modelo").closest(".row") as HTMLElement;
    await u.click(within(carla).getByRole("button", { name: "Contribuiu" }));
    expect(acoes.registrarContribuicao).toHaveBeenCalledWith({ membroId: "c", mes: "2026-10", valor: 25.5 });
    expect(await screen.findByText("Contribuição de R$ 25,50 registrada para Carla Modelo.")).toBeInTheDocument();
    await u.click(within(screen.getByRole("status")).getByRole("button", { name: "Desfazer" }));
    expect(acoes.desfazerContribuicao).toHaveBeenCalledWith({ id: "nova" });
  });

  it("quem já contribuiu tem Desfazer na linha", async () => {
    const u = userEvent.setup();
    montar();
    await u.click(screen.getByRole("button", { name: "Já contribuíram1" }));
    const ana = screen.getByText("Ana Exemplo").closest(".row") as HTMLElement;
    expect(within(ana).getByText("Pago em 07/10")).toBeInTheDocument();
    await u.click(within(ana).getByRole("button", { name: "Desfazer" }));
    expect(acoes.desfazerContribuicao).toHaveBeenCalledWith({ id: "1" });
    expect(await screen.findByText("Contribuição de Ana Exemplo desfeita.")).toBeInTheDocument();
  });

  it("trocar de mês recalcula a lista", async () => {
    const u = userEvent.setup();
    montar();
    expect(screen.getByRole("button", { name: "Próximo mês" })).toBeDisabled();
    await u.click(screen.getByRole("button", { name: "Mês anterior" }));
    expect(screen.getByText("Faltam 2 membros contribuir")).toBeInTheDocument();
    expect(screen.getByText("R$ 20,00")).toBeInTheDocument();
  });

  it("doação avulsa: nome vazio vira Anônimo, com campanha opcional", async () => {
    const u = userEvent.setup();
    montar();
    await u.click(screen.getByRole("button", { name: "Registrar doação avulsa" }));
    const janela = screen.getByRole("dialog", { name: "Doação avulsa" });
    await u.selectOptions(within(janela).getByLabelText("Campanha (opcional)"), "Campanha Exemplo");
    await u.click(within(janela).getByRole("button", { name: "Registrar" }));
    expect(acoes.registrarAvulsa).toHaveBeenCalledWith({
      mes: "2026-10", valor: 20, nome: "", campanhaId: "00000000-0000-4000-a000-0000000000c1",
    });
    expect(await screen.findByText("Doação avulsa de R$ 20,00 registrada (Anônimo).")).toBeInTheDocument();
  });
});
