"use client";

import { type ComponentProps, useEffect, useRef } from "react";

// <dialog> nativo, aberto com showModal() (o navegador cuida do foco, do Esc e do fundo).
// O conteúdo segue o protótipo: header .ad-dlg-h, form e footer .ad-dlg-f.
export function Dialogo({
  aberto,
  aoFechar,
  children,
  ...props
}: { aberto: boolean; aoFechar: () => void } & Omit<ComponentProps<"dialog">, "open" | "onClose">) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (aberto && !d.open) d.showModal();
    if (!aberto && d.open) d.close();
  }, [aberto]);

  return (
    <dialog ref={ref} onClose={aoFechar} {...props}>
      {children}
    </dialog>
  );
}
