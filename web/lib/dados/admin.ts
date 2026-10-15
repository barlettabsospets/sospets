import { connection } from "next/server";
import type { Membro } from "@/lib/dominio/membros";
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

export async function lerValorPadrao(): Promise<number> {
  const supabase = await cliente();
  const { data, error } = await supabase.from("configuracoes").select("valor_padrao").single();
  falhou("configuracoes", error);
  return Number(data!.valor_padrao);
}
