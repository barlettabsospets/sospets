"use client";

import { type ChangeEvent, type PointerEvent, useEffect, useRef, useState } from "react";
import { Dica } from "@/components/ui/Dica";
import { FOCO_CENTRO, type Foco, focoDoToque, posicaoDoFoco } from "@/lib/dominio/fotos";
import { reduzirFoto } from "@/lib/fotos/reduzir";

// Foto no formulário: `previa` é o que aparece no quadrado; `envio` vai para a Server Action
// (ausente = manter a atual; null = remover; Blob = a foto nova, já reduzida).
// `foco`: o ponto principal, que não pode ficar de fora quando o site corta a foto.
// `preparando`: a foto escolhida ainda está sendo reduzida; o formulário não deve salvar ainda.
export type FotoEscolhida = { previa: string | null; envio?: Blob | null; foco: Foco; preparando?: boolean };

// formatos em que a foto aparece no site, para a prévia de "Ajeitar a foto"
export type FormatoDaFoto = { rotulo: string; proporcao: string; redondo?: boolean };

const Pata = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <circle cx="6" cy="11" r="2.2" /><circle cx="10" cy="6" r="2.2" /><circle cx="16" cy="6" r="2.2" /><circle cx="20" cy="11" r="2.2" />
    <path d="M12 12c-3 0-6 3-6 5.5 0 2 1.5 2.5 3 2.5 1.2 0 2-.5 3-.5s1.8.5 3 .5c1.5 0 3-.5 3-2.5C18 15 15 12 12 12z" />
  </svg>
);

// Bloco "Foto" do formulário de pet (admin-animais.html), também usado em Campanhas.
// "Ajeitar" (não existe no protótipo): a pessoa toca ou arrasta até o ponto principal da foto,
// vendo como ela fica nos formatos do site; pelo teclado, dois controles deslizantes.
// O erro aparece aqui dentro, porque o toast fica atrás do diálogo aberto.
export function CampoFoto({
  id, valor, aoMudar, formatos,
}: { id: string; valor: FotoEscolhida; aoMudar: (v: FotoEscolhida) => void; formatos: FormatoDaFoto[] }) {
  const campo = useRef<HTMLInputElement>(null);
  const botaoAjeitar = useRef<HTMLButtonElement>(null);
  const foto = useRef<HTMLImageElement>(null);
  const [erro, setErro] = useState(false);
  const [ajeitando, setAjeitando] = useState(false);
  const { previa, foco } = valor;
  const posicao = posicaoDoFoco(foco);

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
      const reduzida = await reduzirFoto(arquivo);
      setErro(false);
      // foto nova começa centralizada, já com o painel aberto para ajeitar
      aoMudar({ previa: URL.createObjectURL(reduzida), envio: reduzida, foco: FOCO_CENTRO });
      setAjeitando(true);
    } catch {
      setErro(true);
      aoMudar(valor);
    }
  };

  const remover = () => {
    setErro(false);
    setAjeitando(false);
    aoMudar({ previa: null, envio: null, foco: FOCO_CENTRO });
    campo.current?.focus();
  };

  const mudarFoco = (novo: Partial<Foco>) => aoMudar({ ...valor, foco: { ...foco, ...novo } });

  const tocar = (e: PointerEvent<HTMLDivElement>) => {
    if (e.type === "pointermove" && !e.currentTarget.hasPointerCapture(e.pointerId)) return;
    if (e.type === "pointerdown") e.currentTarget.setPointerCapture(e.pointerId);
    const r = foto.current?.getBoundingClientRect();
    if (r) aoMudar({ ...valor, foco: focoDoToque(e.clientX - r.left, e.clientY - r.top, r.width, r.height) });
  };

  const pronto = () => {
    setAjeitando(false);
    botaoAjeitar.current?.focus();
  };

  return (
    <>
      <div className="ad-foto">
        <div className="ad-foto-ph" aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {previa ? <img src={previa} alt="" style={{ objectPosition: posicao }} /> : <Pata />}
        </div>
        <div className="ad-foto-t">
          <div className="com-dica">
            <b>Foto</b>
            <Dica sobre="a foto">Tire na hora ou escolha da galeria. A foto é reduzida e a localização dela é removida.</Dica>
          </div>
          <span className="ad-foto-erro" role="alert" hidden={!erro}>Não foi possível abrir essa foto. Tente outra.</span>
          <div className="ad-foto-b">
            <label className="btn btn-secondary btn-sm" htmlFor={id}>{previa ? "Trocar foto" : "Escolher foto"}</label>
            <input ref={campo} id={id} className="sr-only" type="file" accept="image/*" onChange={escolher} />
            <button
              ref={botaoAjeitar}
              className="btn btn-ghost btn-sm"
              type="button"
              hidden={!previa}
              aria-expanded={ajeitando}
              aria-controls={`${id}-ajeitar`}
              onClick={() => setAjeitando(!ajeitando)}
            >
              Ajeitar
            </button>
            <button className="btn btn-ghost btn-sm" type="button" hidden={!previa} onClick={remover}>Remover</button>
          </div>
        </div>
      </div>

      {previa && ajeitando && (
        <div className="ad-foco" id={`${id}-ajeitar`} role="group" aria-labelledby={`${id}-ajeitar-t`}>
          <div className="ad-foco-h">
            <b id={`${id}-ajeitar-t`}>Ajeitar a foto</b>
            <span>Toque ou arraste até o que não pode ficar de fora, como o rosto.</span>
          </div>
          <div className="ad-foco-b">
            <div className="ad-foco-quadro" onPointerDown={tocar} onPointerMove={tocar}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img ref={foto} src={previa} alt="" draggable={false} />
              <span className="ad-foco-ponto" style={{ left: `${foco.x}%`, top: `${foco.y}%` }} aria-hidden="true" />
              <label className="sr-only">
                Ponto principal, da esquerda para a direita
                <input type="range" min={0} max={100} value={foco.x} aria-valuetext={`${foco.x}%`}
                  onChange={(e) => mudarFoco({ x: Number(e.target.value) })} />
              </label>
              <label className="sr-only">
                Ponto principal, de cima para baixo
                <input type="range" min={0} max={100} value={foco.y} aria-valuetext={`${foco.y}%`}
                  onChange={(e) => mudarFoco({ y: Number(e.target.value) })} />
              </label>
            </div>
            <div className="ad-foco-previas">
              <span>Como fica no site</span>
              <div>
                {formatos.map((f) => (
                  <figure key={f.rotulo}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={previa} alt="" className={f.redondo ? "redondo" : undefined} style={{ aspectRatio: f.proporcao, objectPosition: posicao }} />
                    <figcaption>{f.rotulo}</figcaption>
                  </figure>
                ))}
              </div>
            </div>
          </div>
          <button className="btn btn-secondary btn-sm" type="button" onClick={pronto}>Pronto</button>
        </div>
      )}
    </>
  );
}
