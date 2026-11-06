// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { BotaoAdmin } from "./BotaoAdmin";

const apagar = (nome: string) => { document.cookie = `${nome}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`; };

afterEach(() => {
  cleanup();
  apagar("sb-exemplo-auth-token");
  apagar("sb-exemplo-auth-token.0");
  apagar("outro");
});

describe("BotaoAdmin", () => {
  it("sem sessão: Área do administrador, para /entrar", () => {
    document.cookie = "outro=1; path=/";
    render(<BotaoAdmin />);
    expect(screen.getByRole("link", { name: "Área do administrador" })).toHaveAttribute("href", "/entrar");
  });

  it("com a sessão do Supabase: Voltar à área do administrador", () => {
    document.cookie = "sb-exemplo-auth-token=base64-abc; path=/";
    render(<BotaoAdmin />);
    expect(screen.getByRole("link", { name: "Voltar à área do administrador" })).toHaveAttribute("href", "/admin/contribuicoes");
  });

  it("sessão dividida em partes (.0, .1) também conta", () => {
    document.cookie = "sb-exemplo-auth-token.0=base64-abc; path=/";
    render(<BotaoAdmin />);
    expect(screen.getByRole("link", { name: "Voltar à área do administrador" })).toBeInTheDocument();
  });
});
