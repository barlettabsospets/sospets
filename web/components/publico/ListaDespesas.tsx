"use client";

import { useEffect, useState } from "react";
import { IconeEspecie } from "@/components/ui/IconeEspecie";
import { SeletorDePeriodo } from "@/components/ui/SeletorDePeriodo";
import type { DespesaPublica } from "@/lib/dados/publico";
import { chaveDoPet, porCategoria, porPet, somarDespesas as somar } from "@/lib/dominio/despesas";
import { capitalizar, formatarBRL, mesPorExtenso, nomeDoMes } from "@/lib/dominio/formatacao";
import { type Mes, paraMes } from "@/lib/dominio/meses";

// busca sem acento e sem maiúsculas: "racao" acha "Ração"
const semAcento = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const plural = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`;
// "2026-10-06" → "06/10"
const diaMes = (data: string) => `${data.slice(8, 10)}/${data.slice(5, 7)}`;

// Página Despesas (despesas.html): por mês, com filtro por categoria, por pet e busca.
// despesas: todas, da mais recente para a mais antiga.
export function ListaDespesas({ despesas, mesAtual }: { despesas: DespesaPublica[]; mesAtual: Mes }) {
  // meses com registros, em ordem; abre no mês atual, ou no último com registro
  const meses = [...new Set(despesas.map((d) => paraMes(d.data)))].sort();
  const inicial = meses.includes(mesAtual) ? mesAtual : (meses.at(-1) ?? mesAtual);
  const [mes, setMes] = useState<Mes>(inicial);
  const [fCat, setFCat] = useState<string | null>(null);
  const [fPet, setFPet] = useState<string | null>(null);
  const [texto, setTexto] = useState("");
  const [busca, setBusca] = useState("");

  // link com filtro: /despesas#pet=Luna ou #cat=Castração abre já filtrado, no mês mais recente com registro
  useEffect(() => {
    const hp = new URLSearchParams(location.hash.slice(1));
    const pet = hp.get("pet");
    const cat = hp.get("cat");
    if (!pet && !cat) return;
    const achadas = despesas.filter((d) => (!pet || d.pet === pet) && (!cat || d.categoria === cat));
    /* eslint-disable react-hooks/set-state-in-effect -- o hash só existe no navegador */
    if (pet) setFPet(achadas[0] ? chaveDoPet(achadas[0]) : null);
    if (cat) setFCat(cat);
    if (achadas.length) setMes(paraMes(achadas[0].data));
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [despesas]);

  // a busca espera a pessoa parar de digitar
  useEffect(() => {
    const t = setTimeout(() => setBusca(texto), 150);
    return () => clearTimeout(t);
  }, [texto]);

  const nome = nomeDoMes(mes);
  const doMes = despesas.filter((d) => paraMes(d.data) === mes);
  const total = somar(doMes);

  // categorias do mês, da que mais gastou para a que menos
  const cats = [...new Set(doMes.map((d) => d.categoria))];
  const cat = fCat && cats.includes(fCat) ? fCat : null;
  const porCat = porCategoria(doMes).map((x) => ({ c: x.categoria, cor: x.cor, n: x.quantidade, v: x.total }));
  const maior = Math.max(...porCat.map((x) => x.v), 1);

  // pets do mês: quem mais gastou primeiro, "Vários pets" no fim
  const pets = porPet(doMes).map((x) => ({ k: x.chave, nome: x.nome, especie: x.especie, v: x.total }));
  const pet = fPet !== null && pets.some((x) => x.k === fPet) ? fPet : null;

  // lista: categoria + pet + busca
  const termo = semAcento(busca.trim());
  const lista = doMes.filter(
    (d) =>
      (!cat || d.categoria === cat) &&
      (pet === null || chaveDoPet(d) === pet) &&
      (!termo || semAcento(`${d.descricao} ${d.petId ? d.pet : "vários pets"}`).includes(termo)),
  );
  const filtros = [cat, pet === null ? null : pets.find((x) => x.k === pet)!.nome, termo ? `“${busca.trim()}”` : null].filter(Boolean);

  const alternarCat = (c: string | null) => setFCat(cat === c ? null : c);
  // outro mês: filtros que não existem nele são esquecidos
  const mudarMes = (m: Mes) => {
    const novo = despesas.filter((d) => paraMes(d.data) === m);
    setMes(m);
    if (cat && !novo.some((d) => d.categoria === cat)) setFCat(null);
    if (pet !== null && !novo.some((d) => chaveDoPet(d) === pet)) setFPet(null);
  };
  const limpar = () => {
    setFCat(null);
    setFPet(null);
    setTexto("");
    setBusca("");
  };

  const opcoes = [...meses].reverse().map((m) => ({
    valor: m,
    rotulo: capitalizar(mesPorExtenso(m)),
    etiqueta: m === mesAtual ? "mês atual" : undefined,
  }));

  return (
    <main id="main" className="wrap tp">
      {/* lista à esquerda (o principal), números do mês à direita a partir de 1100 px */}
      <div className="dp-split">
        {/* mês: no computador fica em cima do resumo do mês (coluna da direita); no celular, antes da lista */}
        <div className="dp-period">
          <span className="lab" id="periodo-lab">Selecione o mês</span>
          <SeletorDePeriodo id="periodo" idDoRotulo="periodo-lab" opcoes={opcoes} passos={meses} valor={mes} aoMudar={(v) => mudarMes(v as Mes)} />
        </div>
        <section className="dp-list" aria-labelledby="h-list">
          <div className="dp-h">
            <h1 id="h-list">Despesas</h1>
            <p>Tudo o que foi pago com o dinheiro arrecadado. Busque pela descrição ou pelo pet, ou filtre pela categoria.</p>
          </div>
          <div className="dp-tools">
            <label className="dp-busca">
              <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4.4-4.4" /></svg>
              <span className="sr-only">Buscar pela descrição ou pelo pet</span>
              <input
                type="search"
                placeholder="Buscar despesa ou pet…"
                autoComplete="off"
                spellCheck={false}
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
              />
            </label>
            {/* filtros da lista: categoria com a quantidade de despesas, como na página Pets */}
            <div className="dp-cchips" role="group" aria-label="Categoria">
              <button type="button" aria-pressed={!cat} onClick={() => alternarCat(null)}>
                Todas<b className="num">{doMes.length}</b>
              </button>
              {porCat.map((x) => (
                <button key={x.c} type="button" aria-pressed={cat === x.c} onClick={() => alternarCat(x.c)}>
                  <i style={{ background: x.cor }} aria-hidden="true" />{x.c}<b className="num">{x.n}</b>
                </button>
              ))}
            </div>
          </div>
          <div className="dp-list-h">
            <p className="dp-count" aria-live="polite">
              {plural(lista.length, "despesa", "despesas")} em {nome}{filtros.length ? " · " + filtros.join(" · ") : ""}
            </p>
            <button type="button" className="tp-ani-clear" hidden={!filtros.length} onClick={limpar}>Limpar filtros</button>
          </div>
          <div className="card dp-table">
            <div className="tp-rows">
              <div className="hd" aria-hidden="true">
                <span>Descrição</span><span>Pet</span><span>Categoria</span><span>Data</span><span>Valor</span>
              </div>
              {lista.length ? (
                lista.map((d) => (
                  <div className="tp-row" key={d.id}>
                    <span className="t1">{d.descricao}</span>
                    {d.especie ? (
                      <span className="ani">
                        <IconeEspecie especie={d.especie} />
                        {d.pet}
                        <span className="sr-only"> ({d.especie})</span>
                      </span>
                    ) : (
                      <span className="ani none">Vários pets</span>
                    )}
                    <span className="cat" data-d={diaMes(d.data)}>{d.categoria}</span>
                    <span className="dt">{diaMes(d.data)}</span>
                    <span className="amt">{formatarBRL(d.valor)}</span>
                  </div>
                ))
              ) : (
                <p className="dp-empty">Nenhuma despesa encontrada. Confira a busca ou limpe os filtros.</p>
              )}
            </div>
            <p className="dp-sum">
              {filtros.length ? (
                <><span>Soma do que aparece na lista</span><b>{formatarBRL(somar(lista))}</b></>
              ) : (
                <><span>Total de {nome}</span><b>{formatarBRL(total)}</b></>
              )}
            </p>
          </div>
          <p className="dp-note">
            Descrições não citam nomes de pessoas. Os comprovantes ficam guardados pela organização.
            {meses.length > 0 && ` Registros detalhados a partir de ${mesPorExtenso(meses[0])}.`}
          </p>
        </section>

        <aside className="dp-side" aria-label="Resumo do mês">
          <section className="card dp-total" aria-labelledby="dp-cap" aria-live="polite">
            <div className="card-h"><h2 id="dp-cap">Gasto em {nome}</h2></div>
            <p className="dp-big num">{formatarBRL(total)}</p>
            <p className="dp-tnote">{plural(doMes.length, "despesa", "despesas")} em {plural(cats.length, "categoria", "categorias")}.</p>
            <h3 className="dp-sub">Para onde foi o dinheiro</h3>
            {/* barras com o valor escrito; tocar filtra a lista */}
            <ul className="dp-bars" aria-label="Categorias. Escolha uma para filtrar a lista.">
              {porCat.map((x) => (
                <li key={x.c}>
                  <button type="button" aria-pressed={cat === x.c} className={cat && cat !== x.c ? "off" : undefined} onClick={() => alternarCat(x.c)}>
                    <span className="n">{x.c}</span>
                    <span className="v">{formatarBRL(x.v)}</span>
                    <span className="t" aria-hidden="true"><b style={{ width: `${(x.v / maior) * 100}%`, background: x.cor }} /></span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
          <section className="card dp-anis" aria-labelledby="h-anis">
            <div className="card-h"><h2 id="h-anis">Por pet</h2></div>
            <div className="dp-chips" role="group" aria-label="Pets. Escolha um para filtrar a lista.">
              {pets.map((x) => (
                <button
                  key={x.k}
                  type="button"
                  aria-pressed={pet === x.k}
                  className={pet !== null && pet !== x.k ? "off" : undefined}
                  onClick={() => setFPet(pet === x.k ? null : x.k)}
                >
                  {x.especie ? <><IconeEspecie especie={x.especie} />{x.nome}</> : "Vários pets"}
                  <b>{formatarBRL(x.v)}</b>
                </button>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
}
