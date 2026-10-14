"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { type EstadoDaNovaSenha, salvarNovaSenha } from "@/lib/auth/acoes";

// Tela "Nova senha" (depois do link de convite ou de redefinição), no visual do login.
export function FormularioNovaSenha({ avisoInicial }: { avisoInicial?: string | null }) {
  const [estado, enviar, enviando] = useActionState<EstadoDaNovaSenha, FormData>(salvarNovaSenha, { erro: avisoInicial ?? null });
  const [verSenha, setVerSenha] = useState(false);
  const senha = useRef<HTMLInputElement>(null);
  const repetir = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (estado.campo === "senha") senha.current?.focus();
    if (estado.campo === "repetir") repetir.current?.focus();
  }, [estado]);

  return (
    <form action={enviar} noValidate>
      <div className="field">
        <label htmlFor="senha">Nova senha</label>
        <div className="lg-senha">
          <input
            ref={senha}
            id="senha"
            name="senha"
            type={verSenha ? "text" : "password"}
            autoComplete="new-password"
            aria-describedby="senha-dica"
            aria-invalid={estado.campo === "senha" ? true : undefined}
          />
          <button type="button" aria-pressed={verSenha} aria-controls="senha repetir" onClick={() => setVerSenha(!verSenha)}>
            {verSenha ? "Esconder" : "Mostrar"}
          </button>
        </div>
        <span className="hint" id="senha-dica">Pelo menos 8 caracteres.</span>
      </div>
      <div className="field">
        <label htmlFor="repetir">Repita a nova senha</label>
        <input
          ref={repetir}
          id="repetir"
          name="repetir"
          type={verSenha ? "text" : "password"}
          autoComplete="new-password"
          aria-invalid={estado.campo === "repetir" ? true : undefined}
        />
      </div>
      <p className="lg-erro" role="alert" hidden={!estado.erro}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 7.5v5.5M12 16.5h.01" /></svg>
        <span>{estado.erro}</span>
      </p>
      <button className="btn btn-primary lg-entrar" type="submit" disabled={enviando}>
        Salvar senha e entrar
      </button>
    </form>
  );
}
