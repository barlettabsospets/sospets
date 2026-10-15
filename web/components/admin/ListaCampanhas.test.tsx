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
const fotos = vi.hoisted(() => ({ reduzirFoto: vi.fn<(foto: Blob) => Promise<Blob>>(async () => new Blob(["webp"], { type: "image/webp" })) }));
vi.mock("@/lib/fotos/reduzir", () => fotos);

// o jsdom não tem showModal/close
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () { this.open = true; };
  HTMLDialogElement.prototype.close = function () { this.open = false; this.dispatchEvent(new Event("close")); };
  // o jsdom também não tem endereços blob:
  URL.createObjectURL = () => "blob:previa";
  URL.revokeObjectURL = () => {};
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://exemplo.supabase.co");
});
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const CAMPANHAS: CampanhaDoAdmin[] = [
  { id: "s", nome: "Campanha Stuart (exemplo)", descricao: "Tratamento do Stuart.", meta: 2000, inicio: "2026-08-10", aberta: true, fotoPath: null, arrecadado: 1200, gasto: 980 },
  { id: "n", nome: "Campanha Nelson (exemplo)", descricao: null, meta: null, inicio: "2026-03-02", aberta: false, fotoPath: "nelson.webp", arrecadado: 640, gasto: 640 },
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

  it("foto: mostra a atual, troca pela nova reduzida e remove", async () => {
    const u = userEvent.setup();
    montar();
    await u.click(within(cartao("Campanha Nelson (exemplo)")).getByRole("button", { name: "Editar" }));
    let janela = screen.getByRole("dialog", { name: "Editar campanha" });
    expect(janela.querySelector(".ad-foto-ph img")).toHaveAttribute(
      "src", "https://exemplo.supabase.co/storage/v1/object/public/campanhas/nelson.webp",
    );
    expect(within(janela).getByText("Trocar foto")).toBeInTheDocument();
    await u.click(within(janela).getByRole("button", { name: "Remover" }));
    expect(within(janela).getByLabelText("Escolher foto")).toHaveFocus();
    expect(within(janela).queryByRole("button", { name: "Remover" })).not.toBeInTheDocument();
    await u.click(within(janela).getByRole("button", { name: "Salvar campanha" }));
    expect(acoes.salvarCampanha).toHaveBeenLastCalledWith(expect.objectContaining({ id: "n", foto: null }));

    await u.click(within(cartao("Campanha Stuart (exemplo)")).getByRole("button", { name: "Editar" }));
    janela = screen.getByRole("dialog", { name: "Editar campanha" });
    const original = new File(["jpeg"], "mel.jpg", { type: "image/jpeg" });
    await u.upload(within(janela).getByLabelText("Escolher foto"), original);
    expect(fotos.reduzirFoto).toHaveBeenCalledWith(original);
    expect(await within(janela).findByText("Trocar foto")).toBeInTheDocument();
    await u.click(within(janela).getByRole("button", { name: "Salvar campanha" }));
    const enviada = acoes.salvarCampanha.mock.lastCall![0 as never] as { foto: Blob };
    expect(enviada.foto.type).toBe("image/webp");
  });

  it("não salva enquanto a foto escolhida ainda está sendo reduzida", async () => {
    const u = userEvent.setup();
    let terminar!: (b: Blob) => void;
    fotos.reduzirFoto.mockImplementationOnce(() => new Promise((ok) => { terminar = ok; }));
    montar();
    await u.click(within(cartao("Campanha Stuart (exemplo)")).getByRole("button", { name: "Editar" }));
    const janela = screen.getByRole("dialog", { name: "Editar campanha" });
    await u.upload(within(janela).getByLabelText("Escolher foto"), new File(["jpeg"], "mel.jpg", { type: "image/jpeg" }));
    const salvar = within(janela).getByRole("button", { name: "Salvar campanha" });
    expect(salvar).toBeDisabled();
    terminar(new Blob(["webp"], { type: "image/webp" }));
    await vi.waitFor(() => expect(salvar).toBeEnabled());
    await u.click(salvar);
    expect(acoes.salvarCampanha).toHaveBeenCalledWith(expect.objectContaining({ foto: expect.any(Blob) }));
  });

  it("foto que não abre mostra o erro no próprio formulário", async () => {
    const u = userEvent.setup();
    fotos.reduzirFoto.mockRejectedValueOnce(new Error("HEIC"));
    montar();
    await u.click(screen.getByRole("button", { name: "Nova campanha" }));
    const janela = screen.getByRole("dialog", { name: "Nova campanha" });
    await u.upload(within(janela).getByLabelText("Escolher foto"), new File(["x"], "foto.heic", { type: "image/heic" }));
    expect(await within(janela).findByRole("alert")).toHaveTextContent("Não foi possível abrir essa foto. Tente outra.");
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
