// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

// a Server Action não roda no teste: responde como o Supabase com senha errada
const entrar = vi.fn(async () => ({ erro: "E-mail ou senha incorretos.", campo: "senha" as const, email: "ana@exemplo.com" }));
vi.mock("@/lib/auth/acoes", () => ({ entrar: (...a: unknown[]) => entrar(...(a as [])) }));

const { FormularioEntrar } = await import("./FormularioEntrar");

afterEach(() => {
  cleanup();
  entrar.mockClear();
});

describe("FormularioEntrar", () => {
  it("campo vazio: mostra o erro do protótipo, marca o campo e não envia", async () => {
    const u = userEvent.setup();
    render(<FormularioEntrar />);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    await u.click(screen.getByRole("button", { name: "Entrar" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Informe seu e-mail e a senha para entrar.");
    expect(screen.getByLabelText("E-mail")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByLabelText("E-mail")).toHaveFocus();
    expect(entrar).not.toHaveBeenCalled();

    await u.type(screen.getByLabelText("E-mail"), "ana@exemplo.com");
    await u.click(screen.getByRole("button", { name: "Entrar" }));
    expect(screen.getByLabelText("Senha")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByLabelText("Senha")).toHaveFocus();
  });

  it("erro do servidor aparece na mesma caixa e o foco vai para a senha", async () => {
    const u = userEvent.setup();
    render(<FormularioEntrar />);
    await u.type(screen.getByLabelText("E-mail"), "ana@exemplo.com");
    await u.type(screen.getByLabelText("Senha"), "errada");
    await u.click(screen.getByRole("button", { name: "Entrar" }));
    expect(await screen.findByText("E-mail ou senha incorretos.")).toBeInTheDocument();
    expect(entrar).toHaveBeenCalledOnce();
    expect(screen.getByLabelText("Senha")).toHaveFocus();
  });

  it("Mostrar e Esconder a senha", async () => {
    const u = userEvent.setup();
    render(<FormularioEntrar />);
    const botao = screen.getByRole("button", { name: "Mostrar" });
    expect(screen.getByLabelText("Senha")).toHaveAttribute("type", "password");
    await u.click(botao);
    expect(screen.getByLabelText("Senha")).toHaveAttribute("type", "text");
    expect(screen.getByRole("button", { name: "Esconder" })).toHaveAttribute("aria-pressed", "true");
  });

  it("aviso vindo do proxy (sem acesso) já aparece ao abrir", () => {
    render(<FormularioEntrar avisoInicial="Este e-mail não tem acesso à área do administrador." />);
    expect(screen.getByRole("alert")).toHaveTextContent("Este e-mail não tem acesso");
  });
});
