"use client";

import { type FormEvent, useState, useTransition } from "react";
import { useToast } from "@/components/ui/Toast";
import { type CampoDaSenha, trocarSenha } from "@/lib/admin/conta";

// "Trocar senha" de Minha conta (não existe no protótipo): senha atual, nova e repetir,
// com "Mostrar"/"Esconder" como no login. O erro vai para o toast e o foco para o campo com problema.
export function TrocarSenha() {
  const toast = useToast();
  const [enviando, iniciar] = useTransition();
  const [atual, setAtual] = useState("");
  const [nova, setNova] = useState("");
  const [repetir, setRepetir] = useState("");
  const [ver, setVer] = useState(false);
  const [errado, setErrado] = useState<CampoDaSenha | null>(null);

  const salvar = (e: FormEvent) => {
    e.preventDefault();
    iniciar(async () => {
      const r = await trocarSenha({ atual, nova, repetir });
      if (r.ok) {
        setAtual("");
        setNova("");
        setRepetir("");
        setErrado(null);
        toast("Senha trocada. Use a nova na próxima vez que entrar.");
      } else {
        setErrado(r.campo ?? null);
        toast(r.erro);
        if (r.campo) document.getElementById(`s-${r.campo}`)?.focus();
      }
    });
  };

  return (
    <form className="ad-form" onSubmit={salvar} noValidate>
      <div className="field">
        <label htmlFor="s-atual">Senha atual</label>
        <div className="lg-senha">
          <input
            id="s-atual" type={ver ? "text" : "password"} autoComplete="current-password" required
            aria-invalid={errado === "atual" || undefined} value={atual} onChange={(e) => setAtual(e.target.value)}
          />
          <button type="button" aria-pressed={ver} aria-controls="s-atual s-nova s-repetir" onClick={() => setVer(!ver)}>
            {ver ? "Esconder" : "Mostrar"}
          </button>
        </div>
      </div>
      <div className="field">
        <label htmlFor="s-nova">Nova senha</label>
        <input
          id="s-nova" type={ver ? "text" : "password"} autoComplete="new-password" required minLength={8}
          aria-describedby="s-nova-dica" aria-invalid={errado === "nova" || undefined} value={nova} onChange={(e) => setNova(e.target.value)}
        />
        <span className="hint" id="s-nova-dica">Pelo menos 8 caracteres.</span>
      </div>
      <div className="field">
        <label htmlFor="s-repetir">Repita a nova senha</label>
        <input
          id="s-repetir" type={ver ? "text" : "password"} autoComplete="new-password" required
          aria-invalid={errado === "repetir" || undefined} value={repetir} onChange={(e) => setRepetir(e.target.value)}
        />
      </div>
      <button className="btn btn-primary" type="submit" disabled={enviando}>Salvar nova senha</button>
    </form>
  );
}
