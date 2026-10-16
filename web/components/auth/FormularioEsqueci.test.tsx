// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FormularioEsqueci } from "./FormularioEsqueci";

const acoes = vi.hoisted(() => ({ pedirNovaSenha: vi.fn() }));
vi.mock("@/lib/auth/acoes", () => acoes);

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("FormularioEsqueci", () => {
  it("e-mail inválido: erro em alerta e foco no campo", async () => {
    const u = userEvent.setup();
    acoes.pedirNovaSenha.mockResolvedValueOnce({ erro: "Informe o e-mail com que você entra.", email: "ana" });
    render(<FormularioEsqueci />);
    await u.type(screen.getByLabelText("E-mail"), "ana");
    await u.click(screen.getByRole("button", { name: "Enviar o link" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Informe o e-mail com que você entra.");
    expect(screen.getByLabelText("E-mail")).toHaveFocus();
    expect(screen.getByLabelText("E-mail")).toHaveAttribute("aria-invalid", "true");
  });

  it("enviado: o aviso substitui o formulário, recebe o foco e não diz se o e-mail existe", async () => {
    const u = userEvent.setup();
    acoes.pedirNovaSenha.mockResolvedValueOnce({ erro: null, enviado: true, email: "ana@exemplo.com" });
    render(<FormularioEsqueci />);
    await u.type(screen.getByLabelText("E-mail"), "ana@exemplo.com");
    await u.click(screen.getByRole("button", { name: "Enviar o link" }));
    const aviso = await screen.findByRole("status");
    expect(aviso).toHaveTextContent("Se ana@exemplo.com for o e-mail de alguém da equipe, enviamos um link");
    expect(aviso).toHaveFocus();
    expect(screen.queryByLabelText("E-mail")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Voltar para entrar" })).toHaveAttribute("href", "/entrar");
  });
});
