import { connection } from "next/server";
import { type Contribuicao, diaEmBrasilia } from "@/lib/dominio/contribuicoes";
import type { Membro } from "@/lib/dominio/membros";
import { type Mes, paraMes } from "@/lib/dominio/meses";
import { criarClienteServidor } from "@/lib/supabase/server";

// Dados da área do administrador: lidos das tabelas com a sessão de quem entrou
// (o RLS só libera para administradores ativos). Sem cache.

// connection(): sempre na hora do pedido. Sem isso, o prerender do Next reclama do
// Date.now() que o Supabase usa depois de ler os cookies.
async function cliente() {
  await connection();
  return criarClienteServidor();
}

function falhou(tabela: string, error: { message: string } | null) {
  if (error) throw new Error(`Não foi possível ler ${tabela}: ${error.message}`);
}

// Membros do mais novo para o mais antigo (um membro novo entra no topo, como no protótipo).
export async function lerMembros(): Promise<Membro[]> {
  const supabase = await cliente();
  const { data, error } = await supabase
    .from("membros")
    .select("id, nome, valor_mensal, ativo")
    .order("criado_em", { ascending: false })
    .order("nome");
  falhou("membros", error);
  return (data ?? []).map((m) => ({
    id: m.id,
    nome: m.nome,
    valorMensal: m.valor_mensal === null ? null : Number(m.valor_mensal),
    ativo: m.ativo,
  }));
}

export type Configuracoes = { dadosDesde: Mes; valorPadrao: number; avisoMeses: number };

export async function lerConfiguracoes(): Promise<Configuracoes> {
  const supabase = await cliente();
  const { data, error } = await supabase.from("configuracoes").select("dados_desde, valor_padrao, aviso_meses").single();
  falhou("configuracoes", error);
  return { dadosDesde: paraMes(data!.dados_desde), valorPadrao: Number(data!.valor_padrao), avisoMeses: data!.aviso_meses };
}

// Contribuições não canceladas, de todos os meses (a tela troca de mês sem ir ao servidor).
// Lidas de 1000 em 1000, o limite de cada consulta do Supabase.
export async function lerContribuicoes(): Promise<Contribuicao[]> {
  const supabase = await cliente();
  const todas: Contribuicao[] = [];
  for (let de = 0; ; de += 1000) {
    const { data, error } = await supabase
      .from("contribuicoes")
      .select("id, competencia, valor, membro_id, criado_em")
      .is("cancelada_em", null)
      .order("id")
      .range(de, de + 999);
    falhou("contribuicoes", error);
    todas.push(...(data ?? []).map((c) => ({
      id: c.id,
      competencia: paraMes(c.competencia),
      valor: Number(c.valor),
      membroId: c.membro_id,
      registradaEm: diaEmBrasilia(c.criado_em),
    })));
    if (!data || data.length < 1000) return todas;
  }
}

export type CampanhaAberta = { id: string; nome: string };

// campanhas em andamento, para a doação avulsa
export async function lerCampanhasAbertas(): Promise<CampanhaAberta[]> {
  const supabase = await cliente();
  const { data, error } = await supabase.from("campanhas").select("id, nome").eq("situacao", "em_andamento").order("inicio", { ascending: false });
  falhou("campanhas", error);
  return data ?? [];
}
