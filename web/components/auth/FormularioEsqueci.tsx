"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef } from "react";
import { type EstadoDoPedido, pedirNovaSenha } from "@/lib/auth/acoes";

// "Esqueci minha senha" (T3.4; não existe no protótipo): no visual do login.html.
// Depois de enviar, o formulário dá lugar ao aviso (role="status"), com o foco nele.
export function FormularioEsqueci() {
  const [estado, enviar, enviando] = useActionState<EstadoDoPedido, FormData>(pedirNovaSenha, { erro: null });
  const email = useRef<HTMLInputElement>(null);
  const aviso = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (estado.erro) email.current?.focus();
    if (estado.enviado) aviso.current?.focus();
  }, [estado]);

  if (estado.enviado) {
    return (
      <>
        <p className="lg-ok" role="status" tabIndex={-1} ref={aviso}>
          Se <b>{estado.email}</b> for o e-mail de alguém da equipe, enviamos um link para criar uma nova senha.
          Ele vale por 1 hora. Confira também a caixa de spam.
        </p>
        <Link className="btn btn-primary lg-entrar" href="/entrar">Voltar para entrar</Link>
      </>
    );
  }

  return (
    <form action={enviar} noValidate>
      <div className="field">
        <label htmlFor="email">E-mail</label>
        <input
          ref={email} id="email" name="email" type="email" autoComplete="email" inputMode="email" placeholder="voce@exemplo.com"
          defaultValue={estado.email} aria-invalid={estado.erro ? true : undefined} aria-describedby={estado.erro ? "erro" : undefined}
        />
      </div>
      <p className="lg-erro" id="erro" role="alert" hidden={!estado.erro}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 7.5v5.5M12 16.5h.01" /></svg>
        <span>{estado.erro}</span>
      </p>
      <button className="btn btn-primary lg-entrar" type="submit" disabled={enviando}>Enviar o link</button>
    </form>
  );
}
