"use client";

import { type FormEvent, useActionState, useEffect, useRef, useState } from "react";
import { entrar, type EstadoDoLogin } from "@/lib/auth/acoes";
import { MSG_CAMPOS_VAZIOS } from "@/lib/auth/mensagens";
import { useHidratado } from "@/components/ui/useHidratado";

// Formulário do login.html: erro em caixa vermelha (role="alert"), campo com problema
// marcado com aria-invalid e com o foco, e "Mostrar/Esconder" senha.
export function FormularioEntrar({ proximo, avisoInicial }: { proximo?: string; avisoInicial?: string | null }) {
  const [estado, enviar, enviando] = useActionState<EstadoDoLogin, FormData>(entrar, { erro: avisoInicial ?? null });
  const [erroLocal, setErroLocal] = useState<{ erro: string; campo: "email" | "senha" } | null>(null);
  const [verSenha, setVerSenha] = useState(false);
  // "Mostrar" só aparece quando já funciona (antes disso, o clique se perderia)
  const hidratado = useHidratado();
  const email = useRef<HTMLInputElement>(null);
  const senha = useRef<HTMLInputElement>(null);

  // o que vale é o último erro: o da checagem local ou o que voltou do servidor
  const erro = erroLocal ?? (estado.erro ? { erro: estado.erro, campo: estado.campo } : null);

  // depois de um erro do servidor, o foco vai para o campo com problema
  useEffect(() => {
    if (estado.campo === "email") email.current?.focus();
    if (estado.campo === "senha") senha.current?.focus();
  }, [estado]);

  // como no protótipo: campo vazio nem vai para o servidor
  const conferir = (e: FormEvent<HTMLFormElement>) => {
    const vazio = !email.current?.value.trim() ? "email" : !senha.current?.value ? "senha" : null;
    if (vazio) {
      e.preventDefault();
      setErroLocal({ erro: MSG_CAMPOS_VAZIOS, campo: vazio });
      (vazio === "email" ? email : senha).current?.focus();
    } else {
      setErroLocal(null);
    }
  };

  return (
    <form action={enviar} onSubmit={conferir} noValidate>
      {proximo && <input type="hidden" name="proximo" value={proximo} />}
      <div className="field">
        <label htmlFor="email">E-mail</label>
        <input
          ref={email}
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          inputMode="email"
          placeholder="voce@exemplo.com"
          defaultValue={estado.email}
          aria-invalid={erro?.campo === "email" ? true : undefined}
        />
      </div>
      <div className="field">
        <label htmlFor="senha">Senha</label>
        <div className="lg-senha">
          <input
            ref={senha}
            id="senha"
            name="senha"
            type={verSenha ? "text" : "password"}
            autoComplete="current-password"
            aria-invalid={erro?.campo === "senha" ? true : undefined}
          />
          {/* mostrar a senha ajuda quem digita no celular */}
          {hidratado && (
            <button
              type="button"
              aria-pressed={verSenha}
              aria-controls="senha"
              onClick={() => {
                setVerSenha(!verSenha);
                senha.current?.focus();
              }}
            >
              {verSenha ? "Esconder" : "Mostrar"}
            </button>
          )}
        </div>
      </div>
      <p className="lg-erro" id="erro" role="alert" hidden={!erro}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 7.5v5.5M12 16.5h.01" /></svg>
        <span>{erro?.erro}</span>
      </p>
      <button className="btn btn-primary lg-entrar" type="submit" disabled={enviando}>
        Entrar
      </button>
    </form>
  );
}
