"use client";

import { type ChangeEvent, useEffect, useRef, useState } from "react";
import { reduzirFoto } from "@/lib/fotos/reduzir";

// Foto no formulário: `previa` é o que aparece no quadrado; `envio` vai para a Server Action
// (ausente = manter a atual; null = remover; Blob = a foto nova, já reduzida).
// `preparando`: a foto escolhida ainda está sendo reduzida; o formulário não deve salvar ainda.
export type FotoEscolhida = { previa: string | null; envio?: Blob | null; preparando?: boolean };

const Pata = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <circle cx="6" cy="11" r="2.2" /><circle cx="10" cy="6" r="2.2" /><circle cx="16" cy="6" r="2.2" /><circle cx="20" cy="11" r="2.2" />
    <path d="M12 12c-3 0-6 3-6 5.5 0 2 1.5 2.5 3 2.5 1.2 0 2-.5 3-.5s1.8.5 3 .5c1.5 0 3-.5 3-2.5C18 15 15 12 12 12z" />
  </svg>
);

// Bloco "Foto" do formulário de pet (admin-animais.html), também usado em Campanhas.
// O erro aparece aqui dentro, porque o toast fica atrás do diálogo aberto.
export function CampoFoto({ id, valor, aoMudar }: { id: string; valor: FotoEscolhida; aoMudar: (v: FotoEscolhida) => void }) {
  const campo = useRef<HTMLInputElement>(null);
  const [erro, setErro] = useState(false);
  const { previa } = valor;

  // a prévia de uma foto nova é um endereço blob: que precisa ser liberado
  useEffect(() => () => {
    if (previa?.startsWith("blob:")) URL.revokeObjectURL(previa);
  }, [previa]);

  const escolher = async (e: ChangeEvent<HTMLInputElement>) => {
    const arquivo = e.target.files?.[0];
    e.target.value = "";
    if (!arquivo) return;
    aoMudar({ ...valor, preparando: true });
    try {
      const foto = await reduzirFoto(arquivo);
      setErro(false);
      aoMudar({ previa: URL.createObjectURL(foto), envio: foto });
    } catch {
      setErro(true);
      aoMudar(valor);
    }
  };

  const remover = () => {
    setErro(false);
    aoMudar({ previa: null, envio: null });
    campo.current?.focus();
  };

  return (
    <div className="ad-foto">
      <div className="ad-foto-ph" aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {previa ? <img src={previa} alt="" /> : <Pata />}
      </div>
      <div className="ad-foto-t">
        <b>Foto</b>
        <span>Tire na hora ou escolha da galeria. A foto é reduzida e a localização dela é removida.</span>
        <span className="ad-foto-erro" role="alert" hidden={!erro}>Não foi possível abrir essa foto. Tente outra.</span>
        <div className="ad-foto-b">
          <label className="btn btn-secondary btn-sm" htmlFor={id}>{previa ? "Trocar foto" : "Escolher foto"}</label>
          <input ref={campo} id={id} className="sr-only" type="file" accept="image/*" onChange={escolher} />
          <button className="btn btn-ghost btn-sm" type="button" hidden={!previa} onClick={remover}>Remover</button>
        </div>
      </div>
    </div>
  );
}
