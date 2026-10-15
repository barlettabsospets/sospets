// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { ProvedorDeToast } from "@/components/ui/Toast";
import type { Membro } from "@/lib/dominio/membros";
import { ListaMembros } from "./ListaMembros";

const acoes = vi.hoisted(() => ({
  salvarMembro: vi.fn(async () => ({ ok: true as const, dados: null })),
  mudarAtivo: vi.fn(async () => ({ ok: true as const, dados: null })),
  alterarValorPadrao: vi.fn(async () => ({ ok: true as const, dados: ["id-1"] })),
}));
vi.mock("@/lib/admin/membros", () => acoes);

// o jsdom não tem showModal/close
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () { this.open = true; };
  HTMLDialogElement.prototype.close = function () { this.open = false; this.dispatchEvent(new Event("close")); };
});
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const NOMES = ["Ana Exemplo", "Bruno Teste", "Carla Modelo", "Diego Amostra", "Elisa Fictícia", "Fábio Demo",
  "Gisele Piloto", "Hugo Exemplo", "Irene Teste", "João Modelo", "Karina Amostra", "Úrsula Piloto"];
const MEMBROS: Membro[] = NOMES.map((nome, i) => ({
  id: `id-${i}`, nome, valorMensal: i === 2 ? 30 : null, ativo: i !== 11,
}));

const montar = () =>
  render(
    <ProvedorDeToast>
      <ListaMembros membros={MEMBROS} padrao={20} />
    </ProvedorDeToast>,
  );

describe("ListaMembros", () => {
  it("mostra os resumos e começa nos ativos", () => {
    montar();
    expect(screen.getByText("de 12 membros cadastrados. Quem fica inativo continua com o histórico guardado.")).toBeInTheDocument();
    expect(screen.getByText("11 membros seguem o padrão. 1 tem valor próprio.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ativos11" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("11 membros · mostrando 1–10")).toBeInTheDocument();
    expect(screen.getByText("R$ 30,00 por mês · valor próprio")).toBeInTheDocument();
  });

  it("filtra por inativos e busca sem acento", async () => {
    const u = userEvent.setup();
    montar();
    await u.click(screen.getByRole("button", { name: "Inativos1" }));
    expect(screen.getByText("Úrsula Piloto")).toBeInTheDocument();
    await u.click(screen.getByRole("button", { name: "Todos12" }));
    await u.type(screen.getByRole("searchbox", { name: "Buscar membro" }), "fabio");
    expect(screen.getByText("Fábio Demo")).toBeInTheDocument();
    expect(screen.queryByText("Ana Exemplo")).not.toBeInTheDocument();
    await u.clear(screen.getByRole("searchbox"));
    await u.type(screen.getByRole("searchbox"), "zzz");
    expect(screen.getByText("Ninguém encontrado. Confira o nome ou o filtro.")).toBeVisible();
  });

  it("novo membro: valor igual ao padrão é gravado como null e avisa no toast", async () => {
    const u = userEvent.setup();
    montar();
    await u.click(screen.getByRole("button", { name: "Novo membro" }));
    const janela = screen.getByRole("dialog", { name: "Novo membro" });
    expect(within(janela).getByLabelText("Contribuição mensal")).toHaveValue("20,00");
    await u.type(within(janela).getByLabelText("Nome"), "Zélia Exemplo");
    await u.click(within(janela).getByRole("button", { name: "Salvar membro" }));
    expect(acoes.salvarMembro).toHaveBeenCalledWith({ nome: "Zélia Exemplo", valorMensal: null });
    expect(await screen.findByText("Zélia Exemplo foi adicionado aos membros.")).toBeInTheDocument();
  });

  it("editar: outro valor vira valor próprio, e Desfazer volta o anterior", async () => {
    const u = userEvent.setup();
    montar();
    const linha = screen.getByText("Ana Exemplo").closest(".arow") as HTMLElement;
    await u.click(within(linha).getByRole("button", { name: "Editar" }));
    const janela = screen.getByRole("dialog", { name: "Editar membro" });
    const valor = within(janela).getByLabelText("Contribuição mensal");
    await u.clear(valor);
    await u.type(valor, "25,50");
    await u.click(within(janela).getByRole("button", { name: "Salvar alterações" }));
    expect(acoes.salvarMembro).toHaveBeenCalledWith({ id: "id-0", nome: "Ana Exemplo", valorMensal: 25.5 });
    expect(await screen.findByText("Ana Exemplo foi atualizado: R$ 25,50 por mês.")).toBeInTheDocument();
    await u.click(screen.getByRole("button", { name: "Desfazer" }));
    expect(acoes.salvarMembro).toHaveBeenLastCalledWith({ id: "id-0", nome: "Ana Exemplo", valorMensal: null });
  });

  it("inativar avisa que o histórico fica guardado", async () => {
    const u = userEvent.setup();
    montar();
    const linha = screen.getByText("Bruno Teste").closest(".arow") as HTMLElement;
    await u.click(within(linha).getByRole("button", { name: "Inativar" }));
    expect(acoes.mudarAtivo).toHaveBeenCalledWith({ id: "id-1", ativo: false });
    expect(await screen.findByText("Bruno Teste foi inativado. O histórico fica guardado.")).toBeInTheDocument();
  });

  it("valor padrão: sem aplicar a todos, fixa o antigo; Desfazer libera quem foi fixado", async () => {
    const u = userEvent.setup();
    montar();
    await u.click(screen.getByRole("button", { name: "Alterar valor padrão" }));
    const janela = screen.getByRole("dialog", { name: "Alterar valor padrão" });
    const caixa = within(janela).getByRole("checkbox", {
      name: "Aplicar também aos 11 membros que seguem o padrão hoje (quem tem valor próprio não muda)",
    });
    expect(caixa).toBeChecked();
    await u.click(caixa);
    const valor = within(janela).getByLabelText("Novo valor padrão");
    await u.clear(valor);
    await u.type(valor, "25");
    await u.click(within(janela).getByRole("button", { name: "Salvar valor" }));
    expect(acoes.alterarValorPadrao).toHaveBeenCalledWith({ valor: 25, fixar: true });
    expect(await screen.findByText("Valor padrão alterado para R$ 25,00.")).toBeInTheDocument();
    await u.click(screen.getByRole("button", { name: "Desfazer" }));
    expect(acoes.alterarValorPadrao).toHaveBeenLastCalledWith({ valor: 20, fixar: false, liberar: ["id-1"] });
  });
});
