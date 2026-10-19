"use client";

import Image from "next/image";
import { type CSSProperties, type FormEvent, type ReactNode, useRef, useState, useTransition } from "react";
import { Dialogo } from "@/components/ui/Dialogo";
import { Dica } from "@/components/ui/Dica";
import { Escolha, type OpcaoDeEscolha } from "@/components/ui/Escolha";
import { Foto } from "@/components/ui/Foto";
import { IconeEspecie } from "@/components/ui/IconeEspecie";
import { Paginacao } from "@/components/ui/Paginacao";
import { paginar } from "@/components/ui/paginacao";
import { SeletorDePeriodo } from "@/components/ui/SeletorDePeriodo";
import { useToast } from "@/components/ui/Toast";
import type { Resultado } from "@/lib/admin/membros";
import { apagarPet, restaurarPet, salvarPet } from "@/lib/admin/pets";
import type { PetDoAdmin } from "@/lib/dados/admin";
import { capitalizar, mesAbreviado, mesPorExtenso, semAcento } from "@/lib/dominio/formatacao";
import { FOCO_CENTRO, urlDaFoto } from "@/lib/dominio/fotos";
import { type Mes, listaDeMeses, mesesEntre, paraMes } from "@/lib/dominio/meses";
import {
  castradoNoMes, desdeDaSituacao, type FiltroDoAdmin, linkDoWhatsApp, passaNoFiltro, ROTULO_DO_FILTRO, type SituacaoPet, situacaoPet, tempoDesde,
} from "@/lib/dominio/pets";
import { CampoFoto, type FormatoDaFoto, type FotoEscolhida } from "./CampoFoto";

type Castrado = PetDoAdmin["castrado"];

// cores das situações (admin-animais.html)
const COR_SIT: Record<SituacaoPet, string> = { rua: "#A40E4C", lar: "#2D5F9A", adotado: "#356A2A", falecido: "#6E655E" };
const OPCOES_DO_FILTRO: [FiltroDoAdmin, string, string][] = [
  ["rua", "Na rua", "#A40E4C"], ["lar", "Em lar temporário", "#2D5F9A"], ["adotado", "Adotados", "#356A2A"],
  ["fila", "Na fila de castração", "#E58A3A"], ["falecido", "Falecidos", "#6E655E"],
  ["precisa", "Precisam de lar temporário", "#A40E4C"], ["nec", "Com necessidade agora", "#B3261E"],
];
const OPCOES_DA_SITUACAO: OpcaoDeEscolha[] = [
  { valor: "rua", rotulo: "Na rua", cor: "#A40E4C" }, { valor: "lar", rotulo: "Em lar temporário", cor: "#2D5F9A" },
  { valor: "adotado", rotulo: "Adotado", cor: "#356A2A" }, { valor: "falecido", rotulo: "Falecido", cor: "#8A7F76" },
];
const ROTULO_DO_DESDE: Partial<Record<SituacaoPet, string>> = { lar: "Em lar temporário desde", adotado: "Adotado em", falecido: "Faleceu em" };
// no site, a foto do pet aparece no catálogo (mais larga) e nas bolinhas de "Precisam de lar"
const FORMATOS: FormatoDaFoto[] = [{ rotulo: "Catálogo", proporcao: "4 / 3" }, { rotulo: "Bolinha", proporcao: "1", redondo: true }];

const genero = (p: { sexo: "f" | "m" }, m: string, f: string) => (p.sexo === "f" ? f : m);
const qt = (n: number, texto: string) => <><b className="qt">{n}</b>{texto}</>;

const Mais = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
    <path d="M12 5v14M5 12h14" />
  </svg>
);
const ICONE = {
  casa: <><path d="M4 11 12 4l8 7" /><path d="M6 9.5V20h12V9.5" /></>,
  fila: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></>,
  alerta: <><path d="M12 4 2.5 20h19z" /><path d="M12 10v4M12 17h.01" /></>,
};

// Grupo de botões de rádio no visual do protótipo (.ad-seg).
function Segmentos<T extends string>({
  nome, rotulo, idDoRotulo, opcoes, valor, aoMudar,
}: { nome: string; rotulo?: string; idDoRotulo?: string; opcoes: [T, ReactNode][]; valor: T; aoMudar: (v: T) => void }) {
  return (
    <div className="ad-seg" role="radiogroup" aria-labelledby={idDoRotulo} aria-label={rotulo}>
      {opcoes.map(([v, r]) => (
        <label key={v}>
          <input type="radio" name={nome} value={v} checked={valor === v} onChange={() => aoMudar(v)} />
          <span>{r}</span>
        </label>
      ))}
    </div>
  );
}

const Bicho = ({ especie }: { especie: "cachorro" | "gato" }) => (
  <Image src={especie === "cachorro" ? "/assets/icone-cachorro.webp" : "/assets/icone-gato.webp"} alt="" width={192} height={192} sizes="24px" />
);

// Tela Pets do admin (admin-animais.html): situação de cada pet no mês escolhido, "Precisa de atenção"
// (no mês atual), busca, filtro por situação e a janela de novo pet / editar, com foto.
export function PainelPets({ pets, mesAtual, dadosDesde }: { pets: PetDoAdmin[]; mesAtual: Mes; dadosDesde: Mes }) {
  const toast = useToast();
  const [, iniciar] = useTransition();
  const [mes, setMes] = useState<Mes>(mesAtual);
  const [filtro, setFiltro] = useState<FiltroDoAdmin | null>(null);
  const [busca, setBusca] = useState("");
  const [pagina, setPagina] = useState(1);

  // janela do pet: undefined = fechada; null = novo
  const [editando, setEditando] = useState<PetDoAdmin | null | undefined>(undefined);
  const [nome, setNome] = useState("");
  const [especie, setEspecie] = useState<"cachorro" | "gato">("gato");
  const [sexo, setSexo] = useState<"f" | "m">("f");
  const [idade, setIdade] = useState<"filhote" | "adulto">("adulto");
  const [situacao, setSituacao] = useState<SituacaoPet>("rua");
  const [entrou, setEntrou] = useState("");
  const [desde, setDesde] = useState("");
  const [precisaLar, setPrecisaLar] = useState(false);
  const [necessidade, setNecessidade] = useState("");
  const [castrado, setCastrado] = useState<Castrado>("nao_sei");
  const [vacinado, setVacinado] = useState(false);
  const [vermifugado, setVermifugado] = useState(false);
  const [fivFelv, setFivFelv] = useState(false);
  const [local, setLocal] = useState("");
  const [noSite, setNoSite] = useState(true);
  const [adotanteNome, setAdotanteNome] = useState("");
  const [adotanteTelefone, setAdotanteTelefone] = useState("");
  const [adotanteEndereco, setAdotanteEndereco] = useState("");
  const [foto, setFoto] = useState<FotoEscolhida>({ previa: null, foco: FOCO_CENTRO });
  const campoNome = useRef<HTMLInputElement>(null);
  // janela "Apagar pet"
  const [apagando, setApagando] = useState<PetDoAdmin | null>(null);

  const gravar = (acao: () => Promise<Resultado>, aoGravar: () => void) =>
    iniciar(async () => {
      const r = await acao();
      if (r.ok) aoGravar();
      else toast(r.erro);
    });

  // mês escolhido: a lista mostra a situação de cada pet no fim dele (no mês atual, a situação de hoje)
  const meses = listaDeMeses(dadosDesde < mesAtual ? dadosDesde : mesAtual, mesAtual);
  const opcoesDoMes = [...meses].reverse().map((m) => ({
    valor: m,
    rotulo: capitalizar(mesPorExtenso(m)),
    etiqueta: m === mesAtual ? "mês atual" : undefined,
  }));
  const noMesAtual = mes === mesAtual;
  const presentes = pets.filter((p) => situacaoPet(p, mes) !== null);
  const quantos = (f: FiltroDoAdmin) => pets.filter((p) => passaNoFiltro(p, f, mes)).length;

  // filtro de situação com a quantidade de cada uma; opções com 0 não aparecem (a não ser a escolhida),
  // e "precisam de lar" e "com necessidade" só aparecem quando vêm de "Precisa de atenção"
  const opcoesDoFiltro: OpcaoDeEscolha[] = [
    { valor: "", rotulo: qt(presentes.length, "Todos os pets"), cor: "#7A5641" },
    ...OPCOES_DO_FILTRO
      .filter(([f]) => (quantos(f) > 0 && f !== "precisa" && f !== "nec") || f === filtro)
      .map(([f, rotulo, cor]) => ({ valor: f, rotulo: qt(quantos(f), rotulo), cor })),
  ];

  const necessidades = pets.filter((p) => passaNoFiltro(p, "nec", mes));
  const atencao: (readonly [FiltroDoAdmin, keyof typeof ICONE, string, string])[] = [
    ...(quantos("precisa") > 0
      ? [["precisa", "casa", `${quantos("precisa")} ${quantos("precisa") === 1 ? "precisa" : "precisam"} de lar temporário`, "precisa"] as const]
      : []),
    ...(quantos("fila") > 0 ? [["fila", "fila", `${quantos("fila")} na fila de castração`, "fila"] as const] : []),
    ...necessidades.map((p) => ["nec", "alerta", `${p.nome}: ${p.necessidade!.toLowerCase()}`, p.id] as const),
  ];

  const q = semAcento(busca.trim());
  const lista = presentes.filter((p) => (!filtro || passaNoFiltro(p, filtro, mes)) && (!q || semAcento(p.nome).includes(q)));
  const pg = paginar(lista, pagina, filtro ? ROTULO_DO_FILTRO[filtro] : ["pet", "pets"]);

  const irParaMes = (m: Mes) => {
    setMes(m);
    setPagina(1);
    if (m !== mesAtual && (filtro === "precisa" || filtro === "nec")) setFiltro(null);
  };
  const filtrar = (f: FiltroDoAdmin | null) => {
    setFiltro(f);
    setPagina(1);
  };

  const abrir = (p: PetDoAdmin | null) => {
    const s = p ? situacaoPet(p, mesAtual) ?? "rua" : "rua";
    const d = p && desdeDaSituacao(p, s);
    setEditando(p);
    setNome(p?.nome ?? "");
    setEspecie(p?.especie ?? "gato");
    setSexo(p?.sexo ?? "f");
    setIdade(p?.faixa_idade ?? "adulto");
    setSituacao(s);
    setEntrou(p ? paraMes(p.entrou_em) : mesAtual);
    setDesde(d ? paraMes(d) : mesAtual);
    setPrecisaLar(p?.precisa_lar ?? false);
    setNecessidade(p?.necessidade ?? "");
    setCastrado(p?.castrado ?? "nao_sei");
    setVacinado(p?.vacinado ?? false);
    setVermifugado(p?.vermifugado ?? false);
    setFivFelv(p?.fiv_felv_testado ?? false);
    setLocal(p?.local ?? "");
    setNoSite(!p?.oculto);
    setAdotanteNome(p?.adotante_nome ?? "");
    setAdotanteTelefone(p?.adotante_telefone ?? "");
    setAdotanteEndereco(p?.adotante_endereco ?? "");
    setFoto({
      previa: p?.foto_path ? urlDaFoto(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "", "pets", p.foto_path) : null,
      foco: p?.foto_foco ?? FOCO_CENTRO,
    });
    requestAnimationFrame(() => campoNome.current?.focus());
  };

  const salvar = (e: FormEvent) => {
    e.preventDefault();
    const n = nome.trim();
    if (!n || foto.preparando) return;
    const p = editando;
    setEditando(undefined);
    const dados = {
      nome: n, especie, sexo, faixaIdade: idade, situacao, entrou, desde: situacao === "rua" ? null : desde,
      precisaLar, necessidade, castrado, vacinado, vermifugado, fivFelv, local, noSite, foto: foto.envio, foco: foto.foco,
      adotanteNome, adotanteTelefone, adotanteEndereco,
    };
    gravar(
      () => salvarPet(p ? { id: p.id, ...dados } : dados),
      () => {
        if (p) {
          toast(`${n}: alterações salvas.`, () => gravar(() => restaurarPet(p), () => {}));
        } else {
          filtrar(null);
          toast(`${n} foi ${sexo === "f" ? "cadastrada" : "cadastrado"}.`);
        }
      },
    );
  };

  const abrirApagar = () => {
    setApagando(editando ?? null);
    setEditando(undefined);
  };

  const apagar = (e: FormEvent) => {
    e.preventDefault();
    const p = apagando;
    if (!p) return;
    setApagando(null);
    gravar(() => apagarPet({ id: p.id }), () => toast(`${p.nome} foi ${genero(p, "apagado", "apagada")}.`));
  };

  return (
    <>
      <div className="split ad-topo">
        <aside>
          <div className="ad-period">
            <span className="lab" id="periodo-lab">Selecione o mês</span>
            <SeletorDePeriodo id="periodo" idDoRotulo="periodo-lab" opcoes={opcoesDoMes} passos={meses} valor={mes} aoMudar={(v) => irParaMes(v as Mes)} />
          </div>
          <article className="tile ad-aten" aria-live="polite">
            <h2>Precisa de atenção</h2>
            <ul>
              {!noMesAtual ? (
                <li className="ok">Você está vendo {mesPorExtenso(mes)}. O que precisa de atenção aparece no mês atual.</li>
              ) : atencao.length ? (
                atencao.map(([f, icone, texto, chave]) => (
                  <li key={chave}>
                    <button
                      type="button"
                      aria-pressed={filtro === f}
                      onClick={() => {
                        filtrar(filtro === f ? null : f);
                        document.getElementById("cont")?.scrollIntoView({ block: "nearest" });
                      }}
                    >
                      <svg viewBox="0 0 24 24" aria-hidden="true">{ICONE[icone]}</svg>
                      <span>{texto}</span>
                      <svg className="chev" viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 7 7-7 7" /></svg>
                    </button>
                  </li>
                ))
              ) : (
                <li className="ok">Nada pendente agora.</li>
              )}
            </ul>
          </article>
          <button className="btn btn-primary" type="button" onClick={() => abrir(null)}>
            <Mais />
            Novo pet
          </button>
        </aside>
        <section aria-label="Lista de pets">
          <div className="ahead">
            <div className="com-dica">
              <h1>Pets</h1>
              <Dica sobre="a página Pets">Cadastre os pets, atualize a situação de cada um e escolha quem aparece no site público.</Dica>
            </div>
          </div>
          <div className="ad-tools">
            <label className="ad-busca">
              <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4.4-4.4" /></svg>
              <span className="sr-only">Buscar pelo nome</span>
              <input
                type="search" placeholder="Buscar pelo nome…" autoComplete="off" value={busca}
                onChange={(e) => {
                  setBusca(e.target.value);
                  setPagina(1);
                }}
              />
            </label>
            <div className="ad-filtro">
              <span className="sr-only" id="l-seg">Situação</span>
              <Escolha id="seg" idDoRotulo="l-seg" opcoes={opcoesDoFiltro} valor={filtro ?? ""} aoMudar={(v) => filtrar((v || null) as FiltroDoAdmin | null)} />
            </div>
          </div>
          <div className="ad-list-h">
            <p className="ad-count" id="cont" aria-live="polite">{pg.contador}</p>
            <button type="button" className="btn btn-ghost btn-sm" hidden={!filtro} onClick={() => filtrar(null)}>Limpar filtro</button>
          </div>
          <div className="glist" hidden={lista.length === 0}>
            {pg.itens.length > 0 && (
              <div className="ad-th" aria-hidden="true"><span>Pet</span><span>Espécie e idade</span><span>Situação</span><span>Castrado</span><span /></div>
            )}
            {pg.itens.map((p) => {
              const s = situacaoPet(p, mes)!;
              const bicho = p.especie === "cachorro" ? genero(p, "Cão", "Cadela") : genero(p, "Gato", "Gata");
              const idadeTexto = `${bicho} ${p.faixa_idade === "adulto" ? genero(p, "adulto", "adulta") : "filhote"}`;
              const quando =
                s === "rua" ? tempoDesde(mesesEntre(paraMes(p.entrou_em), mes))
                : s === "lar" ? tempoDesde(mesesEntre(paraMes(p.lar_em!), mes))
                : `em ${mesAbreviado(paraMes(s === "adotado" ? p.adotado_em! : p.obito_em!))}`;
              const nomeSit =
                s === "adotado" ? genero(p, "Adotado", "Adotada") : s === "falecido" ? genero(p, "Falecido", "Falecida")
                : s === "rua" ? "Na rua" : "Em lar temporário";
              const cast = castradoNoMes(p, mes);
              // contato de quem adotou, só para a equipe (pedido da Barbara, 19/10)
              const contato = s === "adotado" ? [p.adotante_nome, p.adotante_telefone].filter(Boolean).join(" · ") : "";
              return (
                <button
                  type="button"
                  key={p.id}
                  className="ad-tr"
                  aria-label={`Editar ${p.nome}: ${idadeTexto}, ${nomeSit} ${quando}${contato ? `, ${genero(p, "adotado", "adotada")} por ${contato}` : ""}, ${cast ? "castrado" : "não castrado"}`}
                  onClick={() => abrir(p)}
                >
                  <span className="c-pet">
                    {p.foto_path ? <Foto className="ft" bucket="pets" caminho={p.foto_path} foco={p.foto_foco} alt="" /> : <IconeEspecie especie={p.especie} />}
                    <b>{p.nome}</b>
                    {p.oculto && <em className="tag">Oculto no site</em>}
                  </span>
                  <span className="c-esp" data-c={` · ${cast ? genero(p, "castrado", "castrada") : genero(p, "não castrado", "não castrada")}`}>{idadeTexto}</span>
                  <span className="c-sit">
                    <span>
                      <em className="sit-b" style={{ "--c": COR_SIT[s] } as CSSProperties}>{nomeSit}</em>
                      <small>{quando}</small>
                      {contato && <small className="ad-adotante">{genero(p, "Adotado", "Adotada")} por {contato}</small>}
                    </span>
                  </span>
                  <span className={`c-cast ${cast ? "sim" : "nao"}`}>{cast ? "Sim" : "Não"}</span>
                  <span className="c-go" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="m9 5 7 7-7 7" /></svg></span>
                </button>
              );
            })}
          </div>
          <div className="empty" hidden={lista.length > 0}>Nenhum pet encontrado. Confira o nome ou o filtro.</div>
          <Paginacao pagina={pg.pagina} paginas={pg.paginas} rotulo="Páginas da lista de pets" aoIr={setPagina} />
        </section>
      </div>

      <Dialogo className="ad-dlg" aberto={editando !== undefined} aoFechar={() => setEditando(undefined)} aria-labelledby="dlg-t">
        <form onSubmit={salvar}>
          <header className="ad-dlg-h">
            <h2 id="dlg-t">{editando ? `Editar ${editando.nome}` : "Novo pet"}</h2>
            <button className="ad-x" type="button" aria-label="Fechar" onClick={() => setEditando(undefined)}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
            </button>
          </header>
          <div className="ad-dlg-b">
            <fieldset className="ad-sec">
              <legend>Quem é</legend>
              <CampoFoto id="p-foto" valor={foto} aoMudar={setFoto} formatos={FORMATOS} />
              <div className="field">
                <label htmlFor="p-nome">Nome</label>
                <input id="p-nome" ref={campoNome} placeholder="Ex.: Mel" required autoComplete="off" maxLength={80} value={nome} onChange={(e) => setNome(e.target.value)} />
              </div>
              <div className="field">
                <span className="lbl" id="l-esp">Espécie</span>
                <Segmentos
                  nome="esp" idDoRotulo="l-esp" valor={especie} aoMudar={setEspecie}
                  opcoes={[["gato", <><Bicho especie="gato" />Gato</>], ["cachorro", <><Bicho especie="cachorro" />Cachorro</>]]}
                />
              </div>
              <div className="ad-row2">
                <div className="field">
                  <span className="lbl" id="l-sx">Sexo</span>
                  <Segmentos nome="sx" idDoRotulo="l-sx" valor={sexo} aoMudar={setSexo} opcoes={[["f", "Fêmea"], ["m", "Macho"]]} />
                </div>
                <div className="field">
                  <span className="lbl" id="l-id">Idade</span>
                  <Segmentos nome="id" idDoRotulo="l-id" valor={idade} aoMudar={setIdade} opcoes={[["filhote", "Filhote"], ["adulto", "Adulto"]]} />
                </div>
              </div>
            </fieldset>

            <fieldset className="ad-sec">
              <legend>Situação</legend>
              <div className="field">
                <span className="lbl sr-only" id="l-sit">Situação atual</span>
                <Escolha id="p-sit" idDoRotulo="l-sit" opcoes={OPCOES_DA_SITUACAO} valor={situacao} aoMudar={(v) => setSituacao(v as SituacaoPet)} />
              </div>
              <div className="ad-row2">
                <div className="field">
                  <label htmlFor="p-ent">Chegou ao grupo em</label>
                  <input id="p-ent" type="month" required max={mesAtual} value={entrou} onChange={(e) => setEntrou(e.target.value)} />
                </div>
                {situacao !== "rua" && (
                  <div className="field">
                    <label htmlFor="p-desde">{ROTULO_DO_DESDE[situacao]}</label>
                    <input id="p-desde" type="month" required min={entrou} max={mesAtual} value={desde} onChange={(e) => setDesde(e.target.value)} />
                  </div>
                )}
              </div>
              {situacao === "falecido" && (
                <p className="ad-aviso">
                  Um pet falecido sai das contas de “na rua”, “em lar temporário” e da fila de castração. O histórico e as despesas dele continuam guardados.
                </p>
              )}
              {situacao === "rua" && (
                <label className="check">
                  <input type="checkbox" checked={precisaLar} onChange={(e) => setPrecisaLar(e.target.checked)} /> Precisa de lar temporário agora
                </label>
              )}
              <div className="field">
                <label htmlFor="p-nec">Precisa de algo agora? (opcional, aparece no site)</label>
                <input id="p-nec" placeholder="Ex.: Precisa de cirurgia" maxLength={120} value={necessidade} onChange={(e) => setNecessidade(e.target.value)} />
              </div>
            </fieldset>

            {situacao === "adotado" && (
              <fieldset className="ad-sec">
                <legend className="com-dica">
                  Adotante (só a equipe vê)
                  <Dica sobre="os dados do adotante">Opcional. Guarde só com a autorização de quem adotou, para acompanhar o pet depois da adoção.</Dica>
                </legend>
                <div className="field">
                  <label htmlFor="p-ad-nome">Nome do adotante</label>
                  <input id="p-ad-nome" autoComplete="off" maxLength={120} value={adotanteNome} onChange={(e) => setAdotanteNome(e.target.value)} />
                </div>
                <div className="ad-row2">
                  <div className="field">
                    <label htmlFor="p-ad-tel">Telefone</label>
                    <input
                      id="p-ad-tel" type="tel" inputMode="tel" autoComplete="off" placeholder="(61) 99999-0000" maxLength={30}
                      value={adotanteTelefone} onChange={(e) => setAdotanteTelefone(e.target.value)}
                    />
                    {linkDoWhatsApp(adotanteTelefone) && (
                      <a className="hint ad-whats" href={linkDoWhatsApp(adotanteTelefone)!} target="_blank" rel="noopener noreferrer">
                        Abrir conversa no WhatsApp
                      </a>
                    )}
                  </div>
                  <div className="field">
                    <label htmlFor="p-ad-end">Endereço</label>
                    <input id="p-ad-end" autoComplete="off" maxLength={200} value={adotanteEndereco} onChange={(e) => setAdotanteEndereco(e.target.value)} />
                  </div>
                </div>
              </fieldset>
            )}

            <fieldset className="ad-sec">
              <legend>Saúde</legend>
              <div className="field">
                <span className="lbl">Castrado?</span>
                <Segmentos nome="cast" rotulo="Castrado?" valor={castrado} aoMudar={setCastrado} opcoes={[["sim", "Sim"], ["nao", "Não"], ["nao_sei", "Não sei"]]} />
              </div>
              <div className="ad-checks">
                <label className="check"><input type="checkbox" checked={vacinado} onChange={(e) => setVacinado(e.target.checked)} /> Vacinado</label>
                <label className="check"><input type="checkbox" checked={vermifugado} onChange={(e) => setVermifugado(e.target.checked)} /> Vermifugado</label>
                {especie === "gato" && (
                  <label className="check"><input type="checkbox" checked={fivFelv} onChange={(e) => setFivFelv(e.target.checked)} /> Testado para FIV/FeLV</label>
                )}
              </div>
            </fieldset>

            <fieldset className="ad-sec">
              <legend>Privacidade</legend>
              <div className="field">
                <label htmlFor="p-loc">{situacao === "adotado" || situacao === "lar" ? "Onde foi resgatado" : "Onde fica"} (só a equipe vê)</label>
                <input id="p-loc" placeholder="Ex.: perto da padaria, quadra 105" maxLength={200} value={local} onChange={(e) => setLocal(e.target.value)} />
              </div>
              <label className="check"><input type="checkbox" checked={noSite} onChange={(e) => setNoSite(e.target.checked)} /> Mostrar no site público</label>
            </fieldset>
          </div>
          <footer className="ad-dlg-f">
            <button className="btn ad-perigo" type="button" hidden={!editando} onClick={abrirApagar}>Apagar pet</button>
            <button className="btn btn-secondary" type="button" onClick={() => setEditando(undefined)}>Cancelar</button>
            <button className="btn btn-primary" type="submit" disabled={foto.preparando}>{editando ? "Salvar alterações" : "Salvar pet"}</button>
          </footer>
        </form>
      </Dialogo>

      <Dialogo aberto={apagando !== null} aoFechar={() => setApagando(null)} aria-labelledby="ap-t">
        <form onSubmit={apagar}>
          <h2 id="ap-t">Apagar {apagando?.nome}?</h2>
          <p className="hint muted">
            Use para um cadastro errado ou repetido. O pet sai do admin e do site de vez, e não dá para desfazer; fica só um registro no histórico de alterações (em Mais).
          </p>
          <p className="hint muted">
            Pet com despesa ligada não pode ser apagado. Para tirá-lo do site, desmarque “Mostrar no site público”.
          </p>
          <div className="btns">
            <button className="btn btn-secondary" type="button" onClick={() => setApagando(null)}>Voltar</button>
            <button className="btn ad-perigo-cheio" type="submit">Apagar pet</button>
          </div>
        </form>
      </Dialogo>
    </>
  );
}
