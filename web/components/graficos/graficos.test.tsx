// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import type { Mes } from "@/lib/dominio/meses";
import { BarrasPorCategoria } from "./BarrasPorCategoria";
import { FluxoMensal, type MesDoFluxo } from "./FluxoMensal";
import { Rosca } from "./Rosca";

// o jsdom não mede tela: simula um computador
beforeAll(() => {
  globalThis.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
  window.matchMedia = vi.fn().mockReturnValue({ matches: false, addEventListener() {}, removeEventListener() {} });
  // cartão com 700 px de largura
  Element.prototype.getBoundingClientRect = () => ({ width: 700, height: 300, top: 0, left: 0, right: 700, bottom: 300, x: 0, y: 0, toJSON() {} });
});
afterEach(cleanup);

// IN e OUT do protótipo
const IN = [520, 640, 900, 830, 960, 1040, 870, 780, 890, 410];
const OUT = [450, 540.5, 790, 640.25, 820, 905.6, 700, 610, 724, 354];
const MESES: MesDoFluxo[] = IN.map((entrou, i) => ({
  mes: `2026-${String(i + 1).padStart(2, "0")}` as Mes,
  entrou,
  saiu: OUT[i],
}));

function Painel({ inicial = null }: { inicial?: Mes | null }) {
  const [mes, setMes] = useState<Mes | null>(inicial);
  return (
    <>
      <p data-testid="periodo">{mes ?? "todos"}</p>
      <FluxoMensal meses={MESES} escolhido={mes} aoEscolher={setMes} />
    </>
  );
}

describe("FluxoMensal", () => {
  it("mostra os últimos 6 meses, cada um como botão com os valores", () => {
    render(<Painel />);
    const botoes = screen.getAllByRole("button", { name: /^Ver / });
    expect(botoes).toHaveLength(6);
    expect(botoes[5]).toHaveAccessibleName("Ver outubro de 2026: entrou R$ 410,00, saiu R$ 354,00");
    expect(screen.getByTitle(/Quanto entrou e quanto saiu de maio a outubro de 2026/)).toBeInTheDocument();
  });

  it("escala igual à do protótipo: linhas de R$ 400, 800 e 1.200", () => {
    const { container } = render(<Painel />);
    const rotulos = [...container.querySelectorAll('svg#mensal text[text-anchor="end"]')].map((t) => t.textContent);
    expect(rotulos).toEqual(["R$ 400", "R$ 800", "R$ 1.200"]);
  });

  it("tocar num mês escolhe; tocar de novo volta para todos", async () => {
    const u = userEvent.setup();
    render(<Painel />);
    const set = screen.getByRole("button", { name: /^Ver setembro/ });
    await u.click(set);
    expect(screen.getByTestId("periodo")).toHaveTextContent("2026-09");
    expect(screen.getByRole("button", { name: /^Ver setembro/ })).toHaveAttribute("aria-pressed", "true");
    await u.click(screen.getByRole("button", { name: /^Ver setembro/ }));
    expect(screen.getByTestId("periodo")).toHaveTextContent("todos");
  });

  it("teclado: ao focar o mês, mostra a dica; Enter escolhe", async () => {
    const u = userEvent.setup();
    render(<Painel />);
    fireEvent.focus(screen.getByRole("button", { name: /^Ver maio/ }));
    expect(screen.getByRole("status")).toHaveTextContent("maioEntrou R$ 960,00Saiu R$ 820,00Sobrou R$ 140,00");
    screen.getByRole("button", { name: /^Ver maio/ }).focus();
    await u.keyboard("{Enter}");
    expect(screen.getByTestId("periodo")).toHaveTextContent("2026-05");
  });

  it("no celular, a mesma escala do protótipo (R$ 600 e R$ 1.200), mesmo vendo só 3 meses", () => {
    vi.mocked(window.matchMedia).mockReturnValueOnce({ matches: true, addEventListener() {}, removeEventListener() {} } as unknown as MediaQueryList);
    const original = Element.prototype.getBoundingClientRect;
    Element.prototype.getBoundingClientRect = () => ({ width: 330, height: 260, top: 0, left: 0, right: 330, bottom: 260, x: 0, y: 0, toJSON() {} });
    const { container } = render(<Painel />);
    expect(screen.getAllByRole("button", { name: /^Ver / })).toHaveLength(3);
    const rotulos = [...container.querySelectorAll('svg#mensal text[text-anchor="end"]')].map((t) => t.textContent);
    expect(rotulos).toEqual(["R$ 600", "R$ 1.200"]);
    Element.prototype.getBoundingClientRect = original;
  });

  it("mês antigo escolhido puxa a janela e a tabela segue", () => {
    render(<Painel inicial="2026-02" />);
    expect(screen.getAllByRole("button", { name: /^Ver / })[0]).toHaveAccessibleName(/^Ver fevereiro/);
    expect(screen.getAllByRole("row")).toHaveLength(7);
  });
});

describe("Rosca", () => {
  const fatias = [
    { nome: "Veterinário e consultas", valor: 180, cor: "#2D5F9A" },
    { nome: "Ração", valor: 120, cor: "#C2477A" },
    { nome: "Outras (vacinas, transporte)", valor: 54, cor: "#CFC3B4" },
  ];

  it("mostra o total e destaca a categoria escolhida na legenda", async () => {
    const u = userEvent.setup();
    const { container } = render(<Rosca fatias={fatias} />);
    const meio = container.querySelector(".mid")!;
    expect(meio).toHaveTextContent("Total gastoR$ 354,00");
    await u.click(screen.getByRole("button", { name: /Outras/ }));
    expect(meio).toHaveTextContent("OutrasR$ 54,0015% do total");
    expect(screen.getByRole("button", { name: /Ração/ })).toHaveClass("off");
    await u.click(screen.getByRole("button", { name: /Outras/ }));
    expect(meio).toHaveTextContent("Total gasto");
  });

  it("sem despesas, avisa", () => {
    render(<Rosca fatias={[]} />);
    expect(screen.getByText("Nenhuma despesa registrada neste período.")).toBeInTheDocument();
  });
});

describe("BarrasPorCategoria", () => {
  it("cada barra filtra e a maior ocupa a largura toda", async () => {
    const u = userEvent.setup();
    const aoAlternar = vi.fn();
    const { container } = render(
      <BarrasPorCategoria
        escolhida="Ração"
        aoAlternar={aoAlternar}
        categorias={[{ nome: "Veterinário e consultas", valor: 180, cor: "#2D5F9A" }, { nome: "Ração", valor: 120, cor: "#C2477A" }]}
      />,
    );
    expect(screen.getByRole("button", { name: /Ração/ })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: /Veterinário/ })).toHaveClass("off");
    const larguras = [...container.querySelectorAll(".t b")].map((b) => (b as HTMLElement).style.width);
    expect(larguras).toEqual(["100%", `${(120 / 180) * 100}%`]);
    await u.click(screen.getByRole("button", { name: /Veterinário/ }));
    expect(aoAlternar).toHaveBeenCalledWith("Veterinário e consultas");
  });
});
