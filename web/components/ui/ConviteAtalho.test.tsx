// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ConviteAtalho, ESPERA_MS } from "./ConviteAtalho";

// matchMedia do jsdom não existe: celular (pointer: coarse), fora do atalho
function midia({ celular = true, atalho = false } = {}) {
  window.matchMedia = ((q: string) => ({
    matches: q.includes("pointer: coarse") ? celular : q.includes("standalone") ? atalho : false,
  })) as unknown as typeof window.matchMedia;
}

function eventoInstalar(outcome = "accepted") {
  const e = new Event("beforeinstallprompt", { cancelable: true });
  return Object.assign(e, { prompt: vi.fn(async () => {}), userChoice: Promise.resolve({ outcome }) });
}

const userAgent = Object.getOwnPropertyDescriptor(window.navigator, "userAgent");

describe("ConviteAtalho", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
    midia();
  });
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    if (userAgent) Object.defineProperty(window.navigator, "userAgent", userAgent);
    else Reflect.deleteProperty(window.navigator, "userAgent");
  });

  it("Android: aparece depois da espera e 'Adicionar' abre a confirmação do navegador", async () => {
    render(<ConviteAtalho />);
    const e = eventoInstalar();
    act(() => void window.dispatchEvent(e));
    expect(e.defaultPrevented).toBe(true);
    expect(screen.queryByRole("complementary")).toBeNull();
    act(() => void vi.advanceTimersByTime(ESPERA_MS));
    expect(screen.getByRole("complementary", { name: /tela inicial/ })).toBeTruthy();
    await act(async () => void fireEvent.click(screen.getByRole("button", { name: "Adicionar" })));
    expect(e.prompt).toHaveBeenCalled();
    expect(screen.queryByRole("complementary")).toBeNull();
  });

  it("'Agora não' esconde e não volta na próxima visita", () => {
    const { unmount } = render(<ConviteAtalho />);
    act(() => {
      window.dispatchEvent(eventoInstalar());
      vi.advanceTimersByTime(ESPERA_MS);
    });
    fireEvent.click(screen.getByRole("button", { name: "Agora não" }));
    expect(screen.queryByRole("complementary")).toBeNull();
    unmount();
    render(<ConviteAtalho />);
    act(() => {
      window.dispatchEvent(eventoInstalar());
      vi.advanceTimersByTime(ESPERA_MS);
    });
    expect(screen.queryByRole("complementary")).toBeNull();
  });

  it("iPhone: explica o caminho pelo Compartilhar, sem botão de adicionar", () => {
    Object.defineProperty(window.navigator, "userAgent", { value: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)", configurable: true });
    render(<ConviteAtalho />);
    act(() => void vi.advanceTimersByTime(ESPERA_MS));
    expect(screen.getByRole("complementary").textContent).toContain("Adicionar à Tela de Início");
    expect(screen.queryByRole("button", { name: "Adicionar" })).toBeNull();
    expect(screen.getByRole("button", { name: "Entendi" })).toBeTruthy();
  });

  it("não aparece no computador nem para quem já abriu pelo atalho", () => {
    for (const m of [{ celular: false }, { atalho: true }]) {
      midia(m);
      const { unmount } = render(<ConviteAtalho />);
      act(() => {
        window.dispatchEvent(eventoInstalar());
        vi.advanceTimersByTime(ESPERA_MS);
      });
      expect(screen.queryByRole("complementary")).toBeNull();
      unmount();
    }
  });
});
