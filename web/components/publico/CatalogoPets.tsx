"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";
import { SeletorDePeriodo } from "@/components/ui/SeletorDePeriodo";
import type { CampanhaPublica, PetPublico } from "@/lib/dados/publico";
import { capitalizar, formatarBRL, mesAbreviado, mesPorExtenso, nomeDoMes, porcentagem, semAcento } from "@/lib/dominio/formatacao";
import { type Mes, listaDeMeses, mesesEntre, paraMes } from "@/lib/dominio/meses";
import { naFilaDeCastracao, saidaDaRua, type SituacaoPet, situacaoPet } from "@/lib/dominio/pets";

const POR_PAGINA = 9;

type Filtro =
  | "rua" | "lar" | "adotado" | "fila" | "precisa"
  | "ev:ent" | "ev:saida" | "ev:ado" | "ev:cast";

const plural = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`;
const genero = (p: PetPublico, m: string, f: string) => (p.sexo === "f" ? f : m);
const tempo = (n: number) => (n <= 0 ? "desde este mês" : n === 1 ? "há 1 mês" : `há ${n} meses`);

const CHIP: Record<SituacaoPet, [string, string]> = {
  rua: ["chip-warn", "Na rua"],
  lar: ["chip-foster", "Em lar temporário"],
  adotado: ["chip-adopted", "Adotado"],
  falecido: ["chip-off", "Em memória"],
};

const Pata = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <circle cx="6" cy="11" r="2.2" /><circle cx="10" cy="6" r="2.2" /><circle cx="16" cy="6" r="2.2" /><circle cx="20" cy="11" r="2.2" />
    <path d="M12 12c-3 0-6 3-6 5.5 0 2 1.5 2.5 3 2.5 1.2 0 2-.5 3-.5s1.8.5 3 .5c1.5 0 3-.5 3-2.5C18 15 15 12 12 12z" />
  </svg>
);
const Seta = () => <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 7 7-7 7" /></svg>;

// TODO(T5.6): foto do Storage quando foto_path existir
const Avatar = ({ grande }: { grande?: boolean }) => (
  <span className={grande ? "av lg" : "av"} aria-hidden="true"><Pata /></span>
);

// Página Pets (animais.html): quem precisa de ajuda, catálogo com busca e filtros,
// chegadas e saídas da rua por mês e fila de castração.
export function CatalogoPets({
  pets, campanhas, mesAtual, dadosDesde,
}: { pets: PetPublico[]; campanhas: CampanhaPublica[]; mesAtual: Mes; dadosDesde: Mes }) {
  const [especie, setEspecie] = useState<"" | "cachorro" | "gato">("");
  const [filtro, setFiltro] = useState<Filtro | null>(null);
  const [texto, setTexto] = useState("");
  const [busca, setBusca] = useState("");
  const [mov, setMov] = useState<"todos" | Mes>(mesAtual);
  const [pagina, setPagina] = useState(1);
  const titulo = useRef<HTMLHeadingElement>(null);
  const paginacao = useRef<HTMLElement>(null);

  // a busca espera a pessoa parar de digitar
  useEffect(() => {
    const t = setTimeout(() => {
      setBusca(texto);
      setPagina(1);
    }, 150);
    return () => clearTimeout(t);
  }, [texto]);

  const sit = (p: PetPublico) => situacaoPet(p, mesAtual);
  const meses = listaDeMeses(dadosDesde, mesAtual);
  const quandoMov = mov === "todos" ? `desde ${nomeDoMes(dadosDesde)}` : `em ${nomeDoMes(mov)}`;
  const noMov = (data: string | Mes | null) =>
    data !== null && (mov === "todos" ? paraMes(data) >= dadosDesde : paraMes(data) === mov);

  // filtro: [quem entra, como a lista se apresenta com n pets]
  const FILTROS: Record<Filtro, [(p: PetPublico) => boolean, (n: number) => string]> = {
    rua: [(p) => sit(p) === "rua", () => "na rua"],
    lar: [(p) => sit(p) === "lar", () => "em lar temporário"],
    adotado: [(p) => sit(p) === "adotado", (n) => (n === 1 ? "adotado" : "adotados")],
    fila: [(p) => naFilaDeCastracao(p, mesAtual), () => "na fila de castração"],
    precisa: [(p) => p.precisa_lar && sit(p) === "rua", (n) => (n === 1 ? "que precisa de lar temporário" : "que precisam de lar temporário")],
    "ev:ent": [(p) => noMov(p.entrou_em), (n) => `que ${n === 1 ? "chegou" : "chegaram"} ${quandoMov}`],
    "ev:saida": [(p) => noMov(saidaDaRua(p)), (n) => `que ${n === 1 ? "saiu" : "saíram"} da rua ${quandoMov}`],
    "ev:ado": [(p) => noMov(p.adotado_em), (n) => `${n === 1 ? "adotado" : "adotados"} ${quandoMov}`],
    "ev:cast": [(p) => noMov(p.castrado_em), (n) => `${n === 1 ? "castrado" : "castrados"} ${quandoMov}`],
  };

  // filtros vindos de fora da barra de filtros (números, faixa de ajuda) levam até o catálogo
  const filtrarDeFora = (f: Filtro, alternar = true) => {
    setFiltro(alternar && filtro === f ? null : f);
    setPagina(1);
    setTexto("");
    setBusca("");
    const reduzido = matchMedia("(prefers-reduced-motion: reduce)").matches;
    titulo.current?.scrollIntoView({ behavior: reduzido ? "auto" : "smooth", block: "start" });
  };

  // --- catálogo
  const f = filtro ? FILTROS[filtro] : null;
  const termo = semAcento(busca.trim());
  const lista = pets.filter((p) => (!especie || p.especie === especie) && (!f || f[0](p)) && (!termo || semAcento(p.nome).includes(termo)));
  const paginas = Math.max(1, Math.ceil(lista.length / POR_PAGINA));
  const p = Math.min(pagina, paginas);
  const quem = especie === "gato" ? ["gato", "gatos"] : especie === "cachorro" ? ["cão", "cães"] : ["pet", "pets"];
  const contador = `${plural(lista.length, quem[0], quem[1])}${f ? " " + f[1](lista.length) : ""}${termo ? ` com “${busca.trim()}” no nome` : ""}`;

  const irParaPagina = (n: number) => {
    setPagina(n);
    requestAnimationFrame(() => {
      if (titulo.current && titulo.current.getBoundingClientRect().top < 0) titulo.current.scrollIntoView({ block: "start" });
      paginacao.current?.querySelector<HTMLButtonElement>("button[aria-current]")?.focus();
    });
  };

  const limpar = () => {
    setFiltro(null);
    setEspecie("");
    setTexto("");
    setBusca("");
    setPagina(1);
  };

  const quantos = (k: Filtro) => pets.filter(FILTROS[k][0]).length;

  return (
    <main id="main" className="wrap tp">
      <Ajuda pets={pets} campanhas={campanhas} mesAtual={mesAtual} aoVer={() => filtrarDeFora("precisa", false)} />

      {/* catálogo à esquerda (principal), números à direita no computador */}
      <div className="an-split">
        <section className="an-cat" aria-labelledby="h-cat">
          <div className="an-cat-h">
            <h1 id="h-cat" ref={titulo}>Nossos pets</h1>
            <p>Busque pelo nome ou filtre pela situação atual.</p>
          </div>
          <div className="an-tools">
            <label className="an-busca">
              <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4.4-4.4" /></svg>
              <span className="sr-only">Buscar pelo nome</span>
              <input
                type="search"
                placeholder="Buscar pelo nome…"
                autoComplete="off"
                spellCheck={false}
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
              />
            </label>
            <div className="an-seg" role="group" aria-label="Espécie">
              {([["", "Todos"], ["cachorro", "Cães"], ["gato", "Gatos"]] as const).map(([v, rotulo]) => (
                <button key={v} type="button" aria-pressed={especie === v} onClick={() => { setEspecie(v); setPagina(1); }}>
                  {rotulo}
                </button>
              ))}
            </div>
            <div className="an-chips" role="group" aria-label="Situação">
              <button type="button" aria-pressed={filtro === null} onClick={() => { setFiltro(null); setPagina(1); }}>
                Todos<b className="num">{pets.length}</b>
              </button>
              {([["rua", "s-rua", "Na rua"], ["lar", "s-lar", "Em lar temporário"], ["adotado", "s-adotado", "Adotados"], ["fila", "s-fila", "Na fila de castração"]] as const).map(
                ([k, classe, rotulo]) => (
                  <button key={k} type="button" className={classe} aria-pressed={filtro === k} onClick={() => { setFiltro(k); setPagina(1); }}>
                    <i aria-hidden="true" />{rotulo}<b className="num">{quantos(k)}</b>
                  </button>
                ),
              )}
            </div>
          </div>
          <div className="an-list-h">
            <p className="an-count" aria-live="polite">{contador}</p>
            <button type="button" className="tp-ani-clear" hidden={!filtro && !especie && !termo} onClick={limpar}>
              Limpar filtros
            </button>
          </div>
          <div className="an-cards">
            {lista.slice((p - 1) * POR_PAGINA, p * POR_PAGINA).map((pet) => (
              <CartaoDoPet key={pet.id} pet={pet} situacao={sit(pet)!} mesAtual={mesAtual} />
            ))}
          </div>
          <div className="empty" hidden={lista.length > 0}>Nenhum pet encontrado. Confira o nome ou limpe os filtros.</div>
          <nav ref={paginacao} className="an-pager" aria-label="Páginas do catálogo" hidden={paginas < 2}>
            <button type="button" disabled={p === 1} aria-label="Página anterior" onClick={() => irParaPagina(p - 1)}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 5-7 7 7 7" /></svg>
            </button>
            {Array.from({ length: paginas }, (_, k) => k + 1).map((n) => (
              <button key={n} type="button" aria-current={n === p ? "page" : undefined} aria-label={`Página ${n} de ${paginas}`} onClick={() => irParaPagina(n)}>
                {n}
              </button>
            ))}
            <button type="button" disabled={p === paginas} aria-label="Próxima página" onClick={() => irParaPagina(p + 1)}>
              <Seta />
            </button>
            <span className="an-pager-t">
              {lista.length ? `${(p - 1) * POR_PAGINA + 1}–${Math.min(p * POR_PAGINA, lista.length)} de ${lista.length}` : ""}
            </span>
          </nav>
        </section>

        {/* o trabalho em números: menor, depois do catálogo */}
        <section className="an-num" aria-label="Números do grupo">
          <div className="tp-grid">
            <Movimento
              pets={pets}
              meses={meses}
              mesAtual={mesAtual}
              dadosDesde={dadosDesde}
              mov={mov}
              aoMudarMes={(v) => { setMov(v); if (filtro?.startsWith("ev:")) setPagina(1); }}
              filtro={filtro}
              contar={(k) => pets.filter(FILTROS[k][0]).length}
              aoFiltrar={filtrarDeFora}
            />
            <FilaDeCastracao pets={pets} mesAtual={mesAtual} ativo={filtro === "fila"} aoVer={() => filtrarDeFora("fila")} />
          </div>
        </section>
      </div>
    </main>
  );
}

function CartaoDoPet({ pet, situacao, mesAtual }: { pet: PetPublico; situacao: SituacaoPet; mesAtual: Mes }) {
  const bicho = pet.especie === "cachorro" ? genero(pet, "Cão", "Cadela") : genero(pet, "Gato", "Gata");
  const quando =
    situacao === "rua" ? tempo(mesesEntre(paraMes(pet.entrou_em), mesAtual))
    : situacao === "lar" ? tempo(mesesEntre(paraMes(pet.lar_em!), mesAtual))
    : situacao === "adotado" ? `em ${mesAbreviado(paraMes(pet.adotado_em!))}`
    : `em ${mesAbreviado(paraMes(pet.obito_em!))}`;
  const castrado = pet.castrado === "sim";
  return (
    <article className="an-card">
      {/* TODO(T5.6): foto do Storage quando foto_path existir */}
      <div className="ph" role="img" aria-label="Ainda sem foto"><Pata /></div>
      <div className="body">
        <h3>{pet.nome}</h3>
        <span className={`chip ${CHIP[situacao][0]}`}>
          {situacao === "adotado" ? genero(pet, "Adotado", "Adotada") : CHIP[situacao][1]}
        </span>
        <p className="info">{bicho} · {quando}</p>
        {castrado ? (
          <p className="cast ok"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>{genero(pet, "Castrado", "Castrada")}</p>
        ) : (
          <p className="cast"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="7.5" /></svg>{genero(pet, "Ainda não castrado", "Ainda não castrada")}</p>
        )}
      </div>
    </article>
  );
}

// faixa de ajuda: quem precisa de lar temporário e uma necessidade ligada a campanha
function Ajuda({ pets, campanhas, mesAtual, aoVer }: { pets: PetPublico[]; campanhas: CampanhaPublica[]; mesAtual: Mes; aoVer: () => void }) {
  const precisa = pets.filter((p) => p.precisa_lar && situacaoPet(p, mesAtual) === "rua");
  // até 3 rostos; se houver mais, um círculo "+N" que mostra todos no catálogo
  const max = precisa.length > 3 ? 2 : 3;
  const resto = precisa.length - max;
  const comNecessidade = pets.find((p) => p.necessidade && ["rua", "lar"].includes(situacaoPet(p, mesAtual) ?? ""));
  const campanha = comNecessidade && campanhas.find((c) => c.aberta && c.nome.includes(comNecessidade.nome));
  const meta = campanha?.meta ? Math.min(100, porcentagem(campanha.arrecadado, campanha.meta)) : null;

  return (
    <section className="an-ajuda" aria-labelledby="h-ajuda">
      <h2 className="sr-only" id="h-ajuda">Quem precisa de ajuda agora</h2>
      <div className="card an-help an-help-lar">
        <div className="an-help-b">
          <h3>Precisam de lar temporário</h3>
          <p className="an-help-t">
            {precisa.length
              ? `${plural(precisa.length, "pet está na rua e pronto", "pets estão na rua e prontos")} para ir para uma casa enquanto espera adoção.`
              : "Nenhum pet esperando lar temporário agora."}
          </p>
        </div>
        <div className="an-avs">
          {precisa.slice(0, max).map((p) => (
            <button key={p.id} type="button" className="an-av" aria-label={`Ver ${p.nome} no catálogo`} onClick={aoVer}>
              <Avatar />
              <b>{p.nome}</b>
            </button>
          ))}
          {resto > 0 && (
            <button type="button" className="an-av" aria-label={`Ver todos os ${precisa.length} no catálogo`} onClick={aoVer}>
              <span className="av mais" aria-hidden="true">+{resto}</span>
              <b>ver todos</b>
            </button>
          )}
        </div>
      </div>
      <div className="card an-help an-help-nec" hidden={!comNecessidade}>
        {comNecessidade && (
          <>
            <div className="an-help-b">
              <h3>{comNecessidade.nome} {comNecessidade.necessidade!.toLowerCase()}</h3>
              {campanha && (
                <>
                  <p className="an-help-t">
                    <b className="num">{formatarBRL(campanha.arrecadado)}</b>
                    {campanha.meta ? ` arrecadados de ${formatarBRL(campanha.meta)}` : " arrecadados"}
                  </p>
                  {meta !== null && (
                    <div className="prog" role="img" aria-label={`${meta}% da meta`}><i style={{ width: `${meta}%` }} /></div>
                  )}
                </>
              )}
            </div>
            <Avatar grande />
          </>
        )}
      </div>
    </section>
  );
}

// chegadas e saídas da rua no mês escolhido: duas barras deitadas, cada uma mostra esses pets no catálogo
function Movimento({
  pets, meses, mesAtual, dadosDesde, mov, aoMudarMes, filtro, contar, aoFiltrar,
}: {
  pets: PetPublico[];
  meses: Mes[];
  mesAtual: Mes;
  dadosDesde: Mes;
  mov: "todos" | Mes;
  aoMudarMes: (v: "todos" | Mes) => void;
  filtro: Filtro | null;
  contar: (k: Filtro) => number;
  aoFiltrar: (f: Filtro) => void;
}) {
  const chegaram = contar("ev:ent");
  const sairam = contar("ev:saida");
  const maior = Math.max(chegaram, sairam, 1);
  const um = (n: number, s: string, p: string) => (n === 1 ? s : p);

  const linha = (k: "ent" | "saida", rotulo: string, n: number) => (
    <button
      type="button"
      className={`an-hb ev-${k}`}
      aria-pressed={filtro === `ev:${k}`}
      aria-label={`${rotulo}: ${n}. Ver no catálogo`}
      onClick={() => aoFiltrar(`ev:${k}`)}
    >
      <span className="l">{rotulo}</span>
      <span className="tr"><i style={{ width: `${(n / maior) * 100}%` }} /></span>
      <b className="num">{n}</b>
    </button>
  );

  const naRua = (mes: Mes) => pets.filter((p) => situacaoPet(p, mes) === "rua").length;
  let fim: ReactNode;
  if (mov === "todos" || mov === mesAtual) {
    fim = <>Hoje, <b>{plural(naRua(mesAtual), "pet está", "pets estão")} na rua</b>.</>;
  } else {
    fim = <>{capitalizar(nomeDoMes(mov))} terminou com <b>{plural(naRua(mov), "pet", "pets")} na rua</b>.</>;
  }

  const opcoes = [
    { valor: "todos", rotulo: `Desde ${nomeDoMes(dadosDesde)}` },
    ...[...meses].reverse().map((m) => ({ valor: m, rotulo: capitalizar(mesPorExtenso(m)), etiqueta: m === mesAtual ? "mês atual" : undefined })),
  ];

  return (
    <section className="card an-mov" aria-labelledby="h-mov">
      <div className="card-h an-mov-h">
        <h3 id="h-mov">Chegadas e saídas da rua</h3>
        <span className="sr-only" id="mov-lab">Mês</span>
        <SeletorDePeriodo id="periodo" idDoRotulo="mov-lab" opcoes={opcoes} passos={meses} valor={mov} aoMudar={(v) => aoMudarMes(v as "todos" | Mes)} />
      </div>
      <div className="an-hbars">
        {linha("ent", um(chegaram, "Chegou", "Chegaram"), chegaram)}
        {linha("saida", um(sairam, "Saiu da rua", "Saíram da rua"), sairam)}
      </div>
      <div className="an-movsum">
        <p className="t">{fim}</p>
        <div className="an-evs">
          {([["ado", "adotado", "adotados"], ["cast", "castrado", "castrados"]] as const).map(([k, s, pl]) => {
            const n = contar(`ev:${k}`);
            return (
              <button key={k} type="button" className={`ev-${k}`} aria-pressed={filtro === `ev:${k}`} onClick={() => aoFiltrar(`ev:${k}`)}>
                <b>{n}</b>{n === 1 ? s : pl}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// fila de castração: anel com a parte já castrada dos pets que ainda não foram adotados (rua ou lar)
function FilaDeCastracao({ pets, mesAtual, ativo, aoVer }: { pets: PetPublico[]; mesAtual: Mes; ativo: boolean; aoVer: () => void }) {
  const base = pets.filter((p) => ["rua", "lar"].includes(situacaoPet(p, mesAtual) ?? ""));
  const fila = base.filter((p) => naFilaDeCastracao(p, mesAtual));
  const feitos = base.length - fila.length;
  const r = 52;
  const C = 2 * Math.PI * r;
  const fracao = base.length ? feitos / base.length : 0;

  return (
    <section className="card an-fila" aria-labelledby="h-fila">
      <div className="card-h">
        <h3 id="h-fila">Fila de castração</h3>
        <span className="meta">ainda não adotados</span>
      </div>
      <div className="an-ring-w">
        <div className="an-ring" role="img" aria-label={`${fila.length} de ${base.length} pets ainda sem castração`}>
          <svg viewBox="0 0 132 132" aria-hidden="true">
            <circle cx="66" cy="66" r={r} className="tr" />
            <circle cx="66" cy="66" r={r} className="fe" strokeDasharray={`${fracao * C} ${C}`} />
          </svg>
          <div className="mid"><b className="num">{fila.length}</b><span>na fila</span></div>
        </div>
        <p className="an-ring-t">
          {base.length ? (
            <><b>{feitos} de {base.length}</b> pets na rua ou em lar temporário já foram castrados. Faltam <b>{fila.length}</b>.</>
          ) : (
            "Nenhum pet esperando castração."
          )}
        </p>
      </div>
      <div className="card-foot an-foot2">
        <button type="button" className="tp-more" aria-pressed={ativo} onClick={aoVer}>
          Ver quem está na fila<Seta />
        </button>
      </div>
    </section>
  );
}
