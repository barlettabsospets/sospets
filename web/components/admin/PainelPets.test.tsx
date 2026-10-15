// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { ProvedorDeToast } from "@/components/ui/Toast";
import type { PetDoAdmin } from "@/lib/dados/admin";
import { PainelPets } from "./PainelPets";

const acoes = vi.hoisted(() => ({
  salvarPet: vi.fn(async () => ({ ok: true as const, dados: null })),
  restaurarPet: vi.fn(async () => ({ ok: true as const, dados: null })),
}));
vi.mock("@/lib/admin/pets", () => acoes);
vi.mock("@/lib/fotos/reduzir", () => ({ reduzirFoto: vi.fn() }));

// o jsdom não tem showModal/close nem scrollIntoView
beforeAll(() => {
  Element.prototype.scrollIntoView = () => {};
  HTMLDialogElement.prototype.showModal = function () { this.open = true; };
  HTMLDialogElement.prototype.close = function () { this.open = false; this.dispatchEvent(new Event("close")); };
});
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const pet = (id: string, nome: string, extra: Partial<PetDoAdmin> = {}): PetDoAdmin => ({
  id: `00000000-0000-4000-a000-00000000000${id}`, nome, especie: "gato", sexo: "f", faixa_idade: "adulto",
  entrou_em: "2026-03-01", lar_em: null, adotado_em: null, obito_em: null, castrado: "nao_sei", castrado_em: null,
  vacinado: false, vermifugado: false, fiv_felv_testado: false, precisa_lar: false, necessidade: null,
  local: null, oculto: false, foto_path: null, foto_foco: { x: 50, y: 50 }, ...extra,
});
const PETS = [
  pet("1", "Mel", { precisa_lar: true }),
  pet("2", "Thor", { especie: "cachorro", sexo: "m", faixa_idade: "filhote", castrado: "sim", castrado_em: "2026-05-01", lar_em: "2026-08-01" }),
  pet("3", "Bento", { especie: "cachorro", sexo: "m", adotado_em: "2026-09-01", castrado: "sim", oculto: true, local: "quadra 105" }),
  pet("4", "Luna", { necessidade: "Precisa de cirurgia" }),
  pet("5", "Novata", { entrou_em: "2026-10-01" }),
];

const montar = () =>
  render(
    <ProvedorDeToast>
      <PainelPets pets={PETS} mesAtual="2026-10" dadosDesde="2026-01" />
    </ProvedorDeToast>,
  );
const linha = (nome: string) => screen.getByRole("button", { name: new RegExp(`^Editar ${nome}:`) });

describe("PainelPets", () => {
  it("tabela com situação no mês, castração e 'Oculto no site'", () => {
    montar();
    expect(screen.getByText("5 pets")).toBeInTheDocument();
    expect(linha("Thor")).toHaveAccessibleName("Editar Thor: Cão filhote, Em lar temporário há 2 meses, castrado");
    expect(linha("Bento")).toHaveAccessibleName("Editar Bento: Cão adulto, Adotado em set/2026, castrado");
    expect(linha("Mel")).toHaveAccessibleName("Editar Mel: Gata adulta, Na rua há 7 meses, não castrado");
    expect(within(linha("Bento")).getByText("Oculto no site")).toBeInTheDocument();
    expect(within(linha("Novata")).getByText("desde este mês")).toBeInTheDocument();
  });

  it("'Precisa de atenção' filtra a lista e só vale no mês atual", async () => {
    const u = userEvent.setup();
    montar();
    const atencao = screen.getByRole("heading", { name: "Precisa de atenção" }).closest("article") as HTMLElement;
    expect(within(atencao).getByRole("button", { name: "1 precisa de lar temporário" })).toBeInTheDocument();
    expect(within(atencao).getByRole("button", { name: "3 na fila de castração" })).toBeInTheDocument();
    const luna = within(atencao).getByRole("button", { name: "Luna: precisa de cirurgia" });
    await u.click(luna);
    expect(luna).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("1 pet com alguma necessidade agora")).toBeInTheDocument();
    expect(linha("Luna")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^Editar Mel:/ })).not.toBeInTheDocument();

    // outro mês: o aviso troca e o filtro de necessidade sai; quem ainda não tinha chegado some
    await u.click(screen.getByRole("button", { name: "Mês anterior" }));
    expect(within(atencao).getByText("Você está vendo setembro de 2026. O que precisa de atenção aparece no mês atual.")).toBeInTheDocument();
    expect(screen.getByText("4 pets")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^Editar Novata:/ })).not.toBeInTheDocument();
  });

  it("busca sem acento e filtro de situação com a quantidade", async () => {
    const u = userEvent.setup();
    montar();
    await u.type(screen.getByRole("searchbox", { name: "Buscar pelo nome" }), "thór");
    expect(screen.getByText("1 pet")).toBeInTheDocument();
    await u.clear(screen.getByRole("searchbox", { name: "Buscar pelo nome" }));
    await u.click(screen.getByRole("button", { name: /^Situação/ }));
    const opcoes = screen.getAllByRole("option").map((o) => o.textContent);
    expect(opcoes).toEqual(["5Todos os pets", "3Na rua", "1Em lar temporário", "1Adotados", "3Na fila de castração"]);
    await u.click(screen.getByRole("option", { name: "1Adotados" }));
    expect(screen.getByText("1 pet adotado")).toBeInTheDocument();
    await u.click(screen.getByRole("button", { name: "Limpar filtro" }));
    expect(screen.getByText("5 pets")).toBeInTheDocument();
  });

  it("novo pet: campos que dependem da situação e da espécie, e salvar", async () => {
    const u = userEvent.setup();
    montar();
    await u.click(screen.getByRole("button", { name: "Novo pet" }));
    const janela = screen.getByRole("dialog", { name: "Novo pet" });
    expect(within(janela).getByLabelText("Testado para FIV/FeLV")).toBeInTheDocument();
    expect(within(janela).getByLabelText("Precisa de lar temporário agora")).toBeInTheDocument();
    expect(within(janela).queryByLabelText(/desde/)).not.toBeInTheDocument();

    await u.type(within(janela).getByLabelText("Nome"), "Pipoca");
    await u.click(within(janela).getByRole("radio", { name: "Cachorro" }));
    expect(within(janela).queryByLabelText("Testado para FIV/FeLV")).not.toBeInTheDocument();
    await u.click(within(janela).getByRole("radio", { name: "Macho" }));
    await u.click(within(janela).getByRole("button", { name: /^Situação atual/ }));
    await u.click(within(janela).getByRole("option", { name: "Em lar temporário" }));
    expect(within(janela).getByLabelText("Em lar temporário desde")).toHaveValue("2026-10");
    expect(within(janela).queryByLabelText("Precisa de lar temporário agora")).not.toBeInTheDocument();
    await u.click(within(janela).getByRole("radio", { name: "Sim" }));
    await u.type(within(janela).getByLabelText("Onde fica (só a equipe vê)"), "quadra 108");
    await u.click(within(janela).getByLabelText("Mostrar no site público"));
    await u.click(within(janela).getByRole("button", { name: "Salvar pet" }));

    expect(acoes.salvarPet).toHaveBeenCalledWith(expect.objectContaining({
      nome: "Pipoca", especie: "cachorro", sexo: "m", faixaIdade: "adulto", situacao: "lar", entrou: "2026-10", desde: "2026-10",
      castrado: "sim", local: "quadra 108", noSite: false, foto: undefined, foco: { x: 50, y: 50 },
    }));
    expect(await screen.findByText("Pipoca foi cadastrado.")).toBeInTheDocument();
  });

  it("editar abre preenchido, e 'Desfazer' restaura a versão anterior", async () => {
    const u = userEvent.setup();
    montar();
    await u.click(linha("Bento"));
    const janela = screen.getByRole("dialog", { name: "Editar Bento" });
    expect(within(janela).getByLabelText("Nome")).toHaveFocus();
    expect(within(janela).getByLabelText("Adotado em")).toHaveValue("2026-09");
    expect(within(janela).getByLabelText("Onde fica (só a equipe vê)")).toHaveValue("quadra 105");
    expect(within(janela).getByLabelText("Mostrar no site público")).not.toBeChecked();
    await u.click(within(janela).getByLabelText("Mostrar no site público"));
    await u.click(within(janela).getByRole("button", { name: "Salvar alterações" }));
    expect(acoes.salvarPet).toHaveBeenCalledWith(expect.objectContaining({ id: PETS[2].id, situacao: "adotado", desde: "2026-09", noSite: true }));
    expect(await screen.findByText("Bento: alterações salvas.")).toBeInTheDocument();
    await u.click(within(screen.getByRole("status")).getByRole("button", { name: "Desfazer" }));
    expect(acoes.restaurarPet).toHaveBeenCalledWith(PETS[2]);
  });

  it("falecido mostra o aviso", async () => {
    const u = userEvent.setup();
    montar();
    await u.click(linha("Mel"));
    const janela = screen.getByRole("dialog", { name: "Editar Mel" });
    await u.click(within(janela).getByRole("button", { name: /^Situação atual/ }));
    await u.click(within(janela).getByRole("option", { name: "Falecido" }));
    expect(within(janela).getByLabelText("Faleceu em")).toBeInTheDocument();
    expect(within(janela).getByText(/Um pet falecido sai das contas/)).toBeInTheDocument();
  });
});
