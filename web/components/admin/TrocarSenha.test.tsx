// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ProvedorDeToast } from "@/components/ui/Toast";
import { TrocarSenha } from "./TrocarSenha";

const acoes = vi.hoisted(() => ({ trocarSenha: vi.fn() }));
vi.mock("@/lib/admin/conta", () => acoes);

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const montar = () => render(<ProvedorDeToast><TrocarSenha /></ProvedorDeToast>);

describe("TrocarSenha", () => {
  it("Mostrar/Esconder vale para os três campos", async () => {
    const u = userEvent.setup();
    montar();
    const mostrar = screen.getByRole("button", { name: "Mostrar" });
    expect(mostrar).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByLabelText("Senha atual")).toHaveAttribute("type", "password");
    await u.click(mostrar);
    expect(screen.getByRole("button", { name: "Esconder" })).toHaveAttribute("aria-pressed", "true");
    for (const r of ["Senha atual", "Nova senha", "Repita a nova senha"]) expect(screen.getByLabelText(r)).toHaveAttribute("type", "text");
  });

  it("senha atual errada: aviso e foco no campo", async () => {
    const u = userEvent.setup();
    acoes.trocarSenha.mockResolvedValueOnce({ ok: false, erro: "A senha atual não confere.", campo: "atual" });
    montar();
    await u.type(screen.getByLabelText("Senha atual"), "errada");
    await u.type(screen.getByLabelText("Nova senha"), "nova-senha-123");
    await u.type(screen.getByLabelText("Repita a nova senha"), "nova-senha-123");
    await u.click(screen.getByRole("button", { name: "Salvar nova senha" }));
    expect(acoes.trocarSenha).toHaveBeenCalledWith({ atual: "errada", nova: "nova-senha-123", repetir: "nova-senha-123" });
    expect(await screen.findByText("A senha atual não confere.")).toBeInTheDocument();
    expect(screen.getByLabelText("Senha atual")).toHaveFocus();
    expect(screen.getByLabelText("Senha atual")).toHaveAttribute("aria-invalid", "true");
  });

  it("deu certo: limpa os campos e avisa", async () => {
    const u = userEvent.setup();
    acoes.trocarSenha.mockResolvedValueOnce({ ok: true, dados: null });
    montar();
    await u.type(screen.getByLabelText("Senha atual"), "antiga-123");
    await u.type(screen.getByLabelText("Nova senha"), "nova-senha-123");
    await u.type(screen.getByLabelText("Repita a nova senha"), "nova-senha-123");
    await u.click(screen.getByRole("button", { name: "Salvar nova senha" }));
    expect(await screen.findByText("Senha trocada. Use a nova na próxima vez que entrar.")).toBeInTheDocument();
    expect(screen.getByLabelText("Senha atual")).toHaveValue("");
    expect(screen.getByLabelText("Nova senha")).not.toHaveAttribute("aria-invalid");
  });
});
