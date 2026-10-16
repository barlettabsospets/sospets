"use client";

import { createContext, type ReactNode, useCallback, useContext, useEffect, useRef, useState } from "react";

type Aviso = { id: number; texto: string; desfazer?: () => void };
type MostrarToast = (texto: string, desfazer?: () => void) => void;

const ContextoToast = createContext<MostrarToast | null>(null);

const DURACAO = 6000;

// Aviso no rodapé (toast do protótipo): role="status" para o leitor de tela anunciar,
// some em 6 segundos e, quando a ação pode ser desfeita, mostra "Desfazer".
export function ProvedorDeToast({ children }: { children: ReactNode }) {
  const [aviso, setAviso] = useState<Aviso | null>(null);
  const contador = useRef(0);

  const mostrar = useCallback<MostrarToast>((texto, desfazer) => {
    setAviso({ id: ++contador.current, texto, desfazer });
  }, []);

  useEffect(() => {
    if (!aviso) return;
    const t = setTimeout(() => setAviso(null), DURACAO);
    return () => clearTimeout(t);
  }, [aviso]);

  return (
    <ContextoToast.Provider value={mostrar}>
      {children}
      <div className="toast" role="status" data-show={aviso ? "" : undefined}>
        {/* key: um aviso novo reinicia a animação, como o reflow do protótipo */}
        <span key={aviso?.id}>{aviso?.texto}</span>
        <button
          className="btn btn-ghost"
          type="button"
          hidden={!aviso?.desfazer}
          onClick={() => {
            aviso?.desfazer?.();
            setAviso(null);
          }}
        >
          Desfazer
        </button>
      </div>
    </ContextoToast.Provider>
  );
}

export function useToast(): MostrarToast {
  const mostrar = useContext(ContextoToast);
  if (!mostrar) throw new Error("useToast precisa estar dentro de <ProvedorDeToast>");
  return mostrar;
}
