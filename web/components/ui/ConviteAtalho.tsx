"use client";

import { useEffect, useState } from "react";

// Convite para pôr o site na tela inicial do celular (não existe no protótipo; pedido da Barbara, 30/10).
// Android/Chrome: o navegador avisa que dá para instalar (beforeinstallprompt) e "Adicionar" abre a
// confirmação dele. iPhone: o Safari não deixa o site fazer isso, então o convite explica o caminho.
// Não aparece no computador, para quem já abriu pelo atalho, nem por 30 dias depois de "Agora não".

type EventoInstalar = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

const CHAVE = "sospets:convite-atalho";
const PAUSA_DIAS = 30;
export const ESPERA_MS = 3000;

function lerPausa(): number | null {
  try {
    const v = localStorage.getItem(CHAVE);
    return v ? Number(v) : null;
  } catch {
    return null;
  }
}

function pausar(dias: number) {
  try {
    localStorage.setItem(CHAVE, String(Date.now() + dias * 86_400_000));
  } catch {
    // sem armazenamento (aba anônima): o convite volta na próxima visita
  }
}

const jaNoAtalho = () =>
  matchMedia("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone === true;
const ehCelular = () => matchMedia("(pointer: coarse)").matches;
const ehIphone = () => /iPhone|iPad|iPod/.test(navigator.userAgent);

export function ConviteAtalho() {
  const [modo, setModo] = useState<"android" | "iphone" | null>(null);
  const [evento, setEvento] = useState<EventoInstalar | null>(null);

  useEffect(() => {
    const pausa = lerPausa();
    if (jaNoAtalho() || !ehCelular() || (pausa && pausa > Date.now())) return;

    let espera: ReturnType<typeof setTimeout> | undefined;
    const mostrarDepois = (m: "android" | "iphone") => {
      clearTimeout(espera);
      espera = setTimeout(() => setModo(m), ESPERA_MS);
    };
    const aoPoderInstalar = (e: Event) => {
      e.preventDefault(); // o convite é nosso, não a barra do navegador
      setEvento(e as EventoInstalar);
      mostrarDepois("android");
    };
    const aoInstalar = () => {
      pausar(3650);
      setModo(null);
    };

    window.addEventListener("beforeinstallprompt", aoPoderInstalar);
    window.addEventListener("appinstalled", aoInstalar);
    if (ehIphone()) mostrarDepois("iphone");
    return () => {
      clearTimeout(espera);
      window.removeEventListener("beforeinstallprompt", aoPoderInstalar);
      window.removeEventListener("appinstalled", aoInstalar);
    };
  }, []);

  const fechar = () => {
    pausar(PAUSA_DIAS);
    setModo(null);
  };

  const adicionar = async () => {
    if (!evento) return;
    await evento.prompt();
    const { outcome } = await evento.userChoice;
    pausar(outcome === "accepted" ? 3650 : PAUSA_DIAS);
    setEvento(null);
    setModo(null);
  };

  if (!modo) return null;
  return (
    <aside className="toast convite-atalho" data-show="" aria-labelledby="convite-atalho-t">
      {/* eslint-disable-next-line @next/next/no-img-element -- ícone pequeno e fixo */}
      <img src="/icones/icone-192.png" alt="" width={40} height={40} />
      <p id="convite-atalho-t">
        {modo === "android" ? (
          <>Coloque o <b>SOS Pets</b> na tela inicial e abra com um toque.</>
        ) : (
          <>
            Coloque o <b>SOS Pets</b> na tela inicial: toque em <b>Compartilhar</b> e depois em{" "}
            <b>Adicionar à Tela de Início</b>.
          </>
        )}
      </p>
      <div className="convite-atalho-b">
        {modo === "android" && (
          <button className="btn convite-atalho-sim" type="button" onClick={adicionar}>
            Adicionar
          </button>
        )}
        <button className="btn btn-ghost" type="button" onClick={fechar}>
          {modo === "android" ? "Agora não" : "Entendi"}
        </button>
      </div>
    </aside>
  );
}
