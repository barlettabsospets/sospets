import type { SupabaseClient } from "@supabase/supabase-js";
import { type Celula, dataBR, mesBR } from "@/lib/dominio/csv";
import { mesAtual, paraMes } from "@/lib/dominio/meses";
import { situacaoPet } from "@/lib/dominio/pets";
import type { Database } from "@/lib/supabase/tipos";

// "Exportar dados" (Mais): cada planilha com tudo, inclusive o que foi cancelado (com o motivo),
// porque serve de cópia de segurança. Dado privado: só a rota do admin chama isto.

type Cliente = SupabaseClient<Database>;
export type Planilha = { cabecalho: string[]; linhas: Celula[][] };
export const PLANILHAS = ["doacoes", "despesas", "pets", "membros"] as const;
export type TipoDePlanilha = (typeof PLANILHAS)[number];

// lê de 1000 em 1000, o limite de cada consulta do Supabase
async function tudo<T>(ler: (de: number, ate: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>) {
  const linhas: T[] = [];
  for (let de = 0; ; de += 1000) {
    const { data, error } = await ler(de, de + 999);
    if (error) throw new Error(`Não foi possível exportar: ${error.message}`);
    linhas.push(...(data ?? []));
    if (!data || data.length < 1000) return linhas;
  }
}

const SITUACAO = { rua: "Na rua", lar: "Em lar temporário", adotado: "Adotado", falecido: "Falecido" };
const CASTRADO = { sim: "Sim", nao: "Não", nao_sei: "Não sei" };

async function doacoes(s: Cliente): Promise<Planilha> {
  const c = await tudo((de, ate) =>
    s.from("contribuicoes")
      .select("competencia, valor, nome_avulso, criado_em, cancelada_em, motivo_cancelamento, membro:membros(nome), campanha:campanhas(nome)")
      .order("competencia").order("criado_em").order("id").range(de, ate),
  );
  return {
    cabecalho: ["Mês", "Valor", "Quem", "Tipo", "Campanha", "Registrada em", "Cancelada em", "Motivo do cancelamento"],
    linhas: c.map((r) => [
      mesBR(r.competencia), Number(r.valor), r.membro?.nome ?? (r.nome_avulso || "Anônimo"), r.membro ? "Membro" : "Doação avulsa",
      r.campanha?.nome ?? null, dataBR(r.criado_em), dataBR(r.cancelada_em), r.motivo_cancelamento,
    ]),
  };
}

async function despesas(s: Cliente): Promise<Planilha> {
  const d = await tudo((de, ate) =>
    s.from("despesas")
      .select("data, descricao, valor, cancelada_em, motivo_cancelamento, categoria:categorias(nome), pet:pets(nome), campanha:campanhas(nome)")
      .order("data").order("criado_em").order("id").range(de, ate),
  );
  return {
    cabecalho: ["Data", "Descrição", "Categoria", "Valor", "Pet", "Campanha", "Cancelada em", "Motivo do cancelamento"],
    linhas: d.map((r) => [
      dataBR(r.data), r.descricao, r.categoria?.nome ?? null, Number(r.valor), r.pet?.nome ?? "Vários pets",
      r.campanha?.nome ?? null, dataBR(r.cancelada_em), r.motivo_cancelamento,
    ]),
  };
}

async function pets(s: Cliente): Promise<Planilha> {
  const p = await tudo((de, ate) => s.from("pets").select("*").order("nome").order("id").range(de, ate));
  const hoje = mesAtual();
  return {
    cabecalho: [
      "Nome", "Espécie", "Sexo", "Idade", "Pelagem", "Situação hoje", "Chegou em", "Em lar temporário desde", "Adotado em", "Faleceu em",
      "Castrado", "Castrado em", "Vacinado", "Vermifugado", "Testado para FIV/FeLV", "Precisa de lar temporário", "Precisa de algo agora",
      "Onde fica (ou onde foi resgatado, se adotado ou em lar temporário)", "Mostrar no site", "Adotante", "Telefone do adotante", "Endereço do adotante",
    ],
    linhas: p.map((r) => {
      const sit = paraMes(r.entrou_em) <= hoje ? situacaoPet(r, hoje) : null;
      return [
        r.nome, r.especie === "cachorro" ? "Cachorro" : "Gato", r.sexo === "f" ? "Fêmea" : "Macho", r.faixa_idade === "filhote" ? "Filhote" : "Adulto",
        r.pelagem, sit ? SITUACAO[sit] : null, mesBR(r.entrou_em), mesBR(r.lar_em), mesBR(r.adotado_em), mesBR(r.obito_em),
        CASTRADO[r.castrado], mesBR(r.castrado_em), r.vacinado, r.vermifugado, r.especie === "gato" ? r.fiv_felv_testado : null,
        r.precisa_lar, r.necessidade, r.local, !r.oculto, r.adotante_nome, r.adotante_telefone, r.adotante_endereco,
      ];
    }),
  };
}

async function membros(s: Cliente): Promise<Planilha> {
  const [m, c] = await Promise.all([
    tudo((de, ate) => s.from("membros").select("id, nome, valor_mensal, ativo").order("nome").order("id").range(de, ate)),
    tudo((de, ate) => s.from("contribuicoes").select("membro_id, competencia").not("membro_id", "is", null).is("cancelada_em", null).order("id").range(de, ate)),
  ]);
  const ultima = new Map<string, string>();
  for (const x of c) if (x.competencia > (ultima.get(x.membro_id!) ?? "")) ultima.set(x.membro_id!, x.competencia);
  return {
    cabecalho: ["Nome", "Contribuição mensal", "Ativo", "Última contribuição"],
    linhas: m.map((r) => [r.nome, r.valor_mensal === null ? "Valor padrão" : Number(r.valor_mensal), r.ativo, mesBR(ultima.get(r.id) ?? null)]),
  };
}

export function lerPlanilha(s: Cliente, tipo: TipoDePlanilha): Promise<Planilha> {
  return { doacoes, despesas, pets, membros }[tipo](s);
}
