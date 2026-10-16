// @vitest-environment jsdom
import { act, cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Escolha } from "./Escolha";
import { GrupoDeBotoes } from "./GrupoDeBotoes";
import { Paginacao } from "./Paginacao";
import { paginar, paginasVisiveis } from "./paginacao";
import { SeletorDePeriodo } from "./SeletorDePeriodo";
import { ProvedorDeToast, useToast } from "./Toast";

afterEach(cleanup);

const MESES = ["2026-08", "2026-09", "2026-10"];
const OPCOES = [
  { valor: "todos", rotulo: "Desde o início" },
  { valor: "2026-10", rotulo: "Outubro de 2026", etiqueta: "mês atual" },
  { valor: "2026-09", rotulo: "Setembro de 2026" },
  { valor: "2026-08", rotulo: "Agosto de 2026" },
];

function Periodo({ inicial = "2026-10" }: { inicial?: string }) {
  const [valor, setValor] = useState(inicial);
  return (
    <>
      <span id="periodo-lab">Período</span>
      <SeletorDePeriodo id="periodo" idDoRotulo="periodo-lab" opcoes={OPCOES} passos={MESES} valor={valor} aoMudar={setValor} />
    </>
  );
}

describe("SeletorDePeriodo", () => {
  it("mostra o período e desabilita a seta do próximo mês no último", () => {
    render(<Periodo />);
    const botao = screen.getByRole("button", { name: "Período Outubro de 2026" });
    expect(botao).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByRole("button", { name: "Próximo mês" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Mês anterior" })).toBeEnabled();
  });

  it("as setas andam pelos meses", async () => {
    const u = userEvent.setup();
    render(<Periodo />);
    await u.click(screen.getByRole("button", { name: "Mês anterior" }));
    expect(screen.getByRole("button", { name: /Setembro de 2026/ })).toBeInTheDocument();
  });

  it("de 'Desde o início', a seta da esquerda volta para o último mês", async () => {
    const u = userEvent.setup();
    render(<Periodo inicial="todos" />);
    expect(screen.getByRole("button", { name: "Próximo mês" })).toBeDisabled();
    await u.click(screen.getByRole("button", { name: "Mês anterior" }));
    expect(screen.getByRole("button", { name: /Outubro de 2026/ })).toBeInTheDocument();
  });

  it("teclado: seta abre, setas andam, Enter escolhe e o foco volta ao botão", async () => {
    const u = userEvent.setup();
    render(<Periodo />);
    const botao = screen.getByRole("button", { name: /Outubro de 2026/ });
    botao.focus();
    await u.keyboard("{ArrowDown}");
    const lista = screen.getByRole("listbox");
    expect(botao).toHaveAttribute("aria-expanded", "true");
    expect(lista).toHaveFocus();
    expect(lista).toHaveAttribute("aria-activedescendant", "periodo-op-2026-10");
    await u.keyboard("{ArrowDown}{Enter}");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Setembro de 2026/ })).toHaveFocus();
  });

  it("Home, End e Esc", async () => {
    const u = userEvent.setup();
    render(<Periodo />);
    await u.click(screen.getByRole("button", { name: /Outubro de 2026/ }));
    const lista = screen.getByRole("listbox");
    await u.keyboard("{End}");
    expect(lista).toHaveAttribute("aria-activedescendant", "periodo-op-2026-08");
    await u.keyboard("{Home}");
    expect(lista).toHaveAttribute("aria-activedescendant", "periodo-op-todos");
    await u.keyboard("{Escape}");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Outubro de 2026/ })).toHaveFocus();
  });

  it("a opção escolhida fica marcada e a etiqueta aparece", async () => {
    const u = userEvent.setup();
    render(<Periodo />);
    await u.click(screen.getByRole("button", { name: /Outubro de 2026/ }));
    expect(screen.getByRole("option", { name: /Outubro de 2026 mês atual/ })).toHaveAttribute("aria-selected", "true");
    await u.click(screen.getByRole("option", { name: "Agosto de 2026" }));
    expect(screen.getByRole("button", { name: /Agosto de 2026/ })).toBeInTheDocument();
  });

  it("clique fora fecha", async () => {
    const u = userEvent.setup();
    render(<><Periodo /><p>fora</p></>);
    await u.click(screen.getByRole("button", { name: /Outubro de 2026/ }));
    await u.click(screen.getByText("fora"));
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });
});

describe("Escolha", () => {
  it("mostra a cor da opção e escolhe pelo teclado", async () => {
    const u = userEvent.setup();
    const aoMudar = vi.fn();
    render(
      <>
        <span id="cat-lab">Categoria</span>
        <Escolha
          id="cat"
          idDoRotulo="cat-lab"
          valor=""
          aoMudar={aoMudar}
          opcoes={[
            { valor: "", rotulo: "Todas" },
            { valor: "racao", rotulo: "Ração", cor: "#C2477A" },
          ]}
        />
      </>,
    );
    const botao = screen.getByRole("button", { name: "Categoria Todas" });
    botao.focus();
    await u.keyboard("{ArrowDown}");
    expect(screen.getByRole("listbox")).toHaveAttribute("aria-activedescendant", "cat-op-todos");
    await u.keyboard("{ArrowDown}{ }");
    expect(aoMudar).toHaveBeenCalledWith("racao");
  });
});

describe("paginar", () => {
  const membros = Array.from({ length: 24 }, (_, i) => i);
  it("10 por página, com o contador do protótipo", () => {
    expect(paginar(membros, 2, ["membro", "membros"])).toMatchObject({
      pagina: 2, paginas: 3, contador: "24 membros · mostrando 11–20",
    });
    expect(paginar(membros, 3, ["membro", "membros"]).itens).toEqual([20, 21, 22, 23]);
    expect(paginar([1], 1, ["membro", "membros"]).contador).toBe("1 membro");
    expect(paginar([], 1, ["membro", "membros"]).contador).toBe("");
  });

  it("página fora do intervalo vai para a mais próxima", () => {
    expect(paginar(membros, 9, ["membro", "membros"]).pagina).toBe(3);
  });
});

describe("Paginacao", () => {
  it("marca a página atual e esconde com uma página só", () => {
    const { rerender } = render(<Paginacao pagina={2} paginas={3} rotulo="Páginas da lista" aoIr={() => {}} />);
    expect(screen.getByRole("button", { name: "Página 2 de 3" })).toHaveAttribute("aria-current", "page");
    rerender(<Paginacao pagina={1} paginas={1} rotulo="Páginas da lista" aoIr={() => {}} />);
    expect(screen.queryByRole("navigation", { name: "Páginas da lista" })).not.toBeInTheDocument();
  });
});

describe("GrupoDeBotoes", () => {
  it("um botão marcado por vez", async () => {
    const u = userEvent.setup();
    const aoMudar = vi.fn();
    render(<GrupoDeBotoes rotulo="Mostrar" valor="pend" aoMudar={aoMudar} opcoes={[{ valor: "pend", rotulo: "Faltam" }, { valor: "paid", rotulo: "Pagos" }]} />);
    expect(screen.getByRole("button", { name: "Faltam" })).toHaveAttribute("aria-pressed", "true");
    await u.click(screen.getByRole("button", { name: "Pagos" }));
    expect(aoMudar).toHaveBeenCalledWith("paid");
  });
});

describe("Toast", () => {
  function Acao({ desfazer }: { desfazer?: () => void }) {
    const toast = useToast();
    return <button onClick={() => toast("Contribuição de R$ 20,00 registrada.", desfazer)}>Registrar</button>;
  }

  it("anuncia, oferece Desfazer e some em 6 segundos", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const u = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const desfazer = vi.fn();
    render(<ProvedorDeToast><Acao desfazer={desfazer} /></ProvedorDeToast>);
    await u.click(screen.getByRole("button", { name: "Registrar" }));
    const status = screen.getByRole("status");
    expect(status).toHaveTextContent("Contribuição de R$ 20,00 registrada.");
    expect(status).toHaveAttribute("data-show");
    await u.click(screen.getByRole("button", { name: "Desfazer" }));
    expect(desfazer).toHaveBeenCalledOnce();
    expect(status).not.toHaveAttribute("data-show");

    await u.click(screen.getByRole("button", { name: "Registrar" }));
    act(() => vi.advanceTimersByTime(6000));
    expect(status).not.toHaveAttribute("data-show");
    vi.useRealTimers();
  });

  it("sem desfazer, o botão fica escondido", async () => {
    const u = userEvent.setup();
    render(<ProvedorDeToast><Acao /></ProvedorDeToast>);
    await u.click(screen.getByRole("button", { name: "Registrar" }));
    expect(screen.queryByRole("button", { name: "Desfazer" })).not.toBeInTheDocument();
  });
});

describe("paginasVisiveis", () => {
  it("até 9 páginas, todas, como no protótipo", () => {
    expect(paginasVisiveis(1, 3)).toEqual([1, 2, 3]);
    expect(paginasVisiveis(5, 9)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });
  it("com muitas, a primeira, a última e as vizinhas da atual, com … (null) entre elas", () => {
    expect(paginasVisiveis(1, 40)).toEqual([1, 2, 3, 4, 5, null, 40]);
    expect(paginasVisiveis(5, 40)).toEqual([1, null, 4, 5, 6, null, 40]);
    expect(paginasVisiveis(3, 40)).toEqual([1, 2, 3, 4, 5, null, 40]);
    expect(paginasVisiveis(40, 40)).toEqual([1, null, 36, 37, 38, 39, 40]);
    expect(paginasVisiveis(37, 40)).toEqual([1, null, 36, 37, 38, 39, 40]);
  });
  it("na tela, o … fica escondido do leitor de tela e a página atual é marcada", () => {
    render(<Paginacao pagina={20} paginas={40} rotulo="Páginas do histórico" aoIr={() => {}} />);
    expect(screen.getAllByRole("button").map((b) => b.getAttribute("aria-label"))).toEqual([
      "Página anterior", "Página 1 de 40", "Página 19 de 40", "Página 20 de 40", "Página 21 de 40", "Página 40 de 40", "Próxima página",
    ]);
    expect(screen.getByRole("button", { name: "Página 20 de 40" })).toHaveAttribute("aria-current", "page");
  });
});
