import { connection } from "next/server";
import { POR_PAGINA } from "@/components/ui/paginacao";
import { type Contribuicao, diaEmBrasilia } from "@/lib/dominio/contribuicoes";
import type { Foco } from "@/lib/dominio/fotos";
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

export type Configuracoes = { dadosDesde: Mes; dataDesde: string; valorPadrao: number; avisoMeses: number };

export async function lerConfiguracoes(): Promise<Configuracoes> {
  const supabase = await cliente();
  const { data, error } = await supabase.from("configuracoes").select("dados_desde, valor_padrao, aviso_meses").single();
  falhou("configuracoes", error);
  return { dadosDesde: paraMes(data!.dados_desde), dataDesde: data!.dados_desde, valorPadrao: Number(data!.valor_padrao), avisoMeses: data!.aviso_meses };
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

export type Categoria = { id: string; nome: string; cor: string; ativa: boolean };

// todas as categorias: as ativas na ordem da tabela (Outros por último no seed), depois as desativadas.
// Despesa nova só usa as ativas; as antigas continuam com a categoria que tinham.
export async function lerCategorias(): Promise<Categoria[]> {
  const supabase = await cliente();
  const { data, error } = await supabase
    .from("categorias")
    .select("id, nome, cor, ativa")
    .order("ativa", { ascending: false })
    .order("ordem")
    .order("nome");
  falhou("categorias", error);
  return data ?? [];
}

export type CampanhaDoAdmin = {
  id: string;
  nome: string;
  descricao: string | null;
  meta: number | null;
  inicio: string;
  aberta: boolean;
  fotoPath: string | null;
  fotoFoco: Foco;
  arrecadado: number;
  gasto: number;
};

// todas as campanhas, das mais novas para as mais antigas, com os totais na hora (sem o cache público)
export async function lerCampanhasDoAdmin(): Promise<CampanhaDoAdmin[]> {
  const supabase = await cliente();
  const { data, error } = await supabase
    .from("pub_campanhas")
    .select("id, nome, descricao, meta, inicio, situacao, foto_path, foto_foco_x, foto_foco_y, arrecadado, gasto")
    .order("inicio", { ascending: false });
  falhou("pub_campanhas", error);
  return (data ?? []).map((c) => ({
    id: c.id!,
    nome: c.nome!,
    descricao: c.descricao,
    meta: c.meta === null ? null : Number(c.meta),
    inicio: c.inicio!,
    aberta: c.situacao === "em_andamento",
    fotoPath: c.foto_path,
    fotoFoco: { x: c.foto_foco_x ?? 50, y: c.foto_foco_y ?? 50 },
    arrecadado: Number(c.arrecadado),
    gasto: Number(c.gasto),
  }));
}

export type DespesaDoAdmin = {
  id: string;
  data: string;
  descricao: string;
  valor: number;
  categoriaId: string;
  categoria: string;
  cor: string;
  petId: string | null;
  pet: string | null;
  especie: "cachorro" | "gato" | null;
  campanhaId: string | null;
  // motivo, quando cancelada
  cancelada: string | null;
};

// Todas as despesas, inclusive as canceladas (aparecem riscadas), da mais recente para a mais antiga.
export async function lerDespesasDoAdmin(): Promise<DespesaDoAdmin[]> {
  const supabase = await cliente();
  const todas: DespesaDoAdmin[] = [];
  for (let de = 0; ; de += 1000) {
    const { data, error } = await supabase
      .from("despesas")
      .select("id, data, descricao, valor, categoria_id, pet_id, campanha_id, cancelada_em, motivo_cancelamento, categorias(nome, cor), pets(nome, especie)")
      .order("data", { ascending: false })
      .order("criado_em", { ascending: false })
      .range(de, de + 999);
    falhou("despesas", error);
    todas.push(...(data ?? []).map((d) => ({
      id: d.id,
      data: d.data,
      descricao: d.descricao,
      valor: Number(d.valor),
      categoriaId: d.categoria_id,
      categoria: d.categorias.nome,
      cor: d.categorias.cor,
      petId: d.pet_id,
      pet: d.pets?.nome ?? null,
      especie: d.pets?.especie ?? null,
      campanhaId: d.campanha_id,
      cancelada: d.cancelada_em ? (d.motivo_cancelamento ?? "") : null,
    })));
    if (!data || data.length < 1000) return todas;
  }
}

export type PetParaEscolha = { id: string; nome: string };

// todos os pets (também os ocultos do site), em ordem alfabética, para "Pet (opcional)"
export async function lerPetsParaEscolha(): Promise<PetParaEscolha[]> {
  const supabase = await cliente();
  const { data, error } = await supabase.from("pets").select("id, nome").order("nome");
  falhou("pets", error);
  return data ?? [];
}

// Pet na tela Pets do admin: tudo de pets, inclusive o local e o "oculto" (só a equipe vê).
export type PetDoAdmin = {
  id: string;
  nome: string;
  especie: "cachorro" | "gato";
  sexo: "f" | "m";
  faixa_idade: "filhote" | "adulto";
  entrou_em: string;
  lar_em: string | null;
  adotado_em: string | null;
  obito_em: string | null;
  castrado: "sim" | "nao" | "nao_sei";
  castrado_em: string | null;
  vacinado: boolean;
  vermifugado: boolean;
  fiv_felv_testado: boolean;
  precisa_lar: boolean;
  necessidade: string | null;
  local: string | null;
  oculto: boolean;
  foto_path: string | null;
  foto_foco: Foco;
};

// do cadastro mais recente para o mais antigo, como o catálogo (pet novo entra no topo)
export async function lerPetsDoAdmin(): Promise<PetDoAdmin[]> {
  const supabase = await cliente();
  const { data, error } = await supabase
    .from("pets")
    .select("id, nome, especie, sexo, faixa_idade, entrou_em, lar_em, adotado_em, obito_em, castrado, castrado_em, vacinado, vermifugado, fiv_felv_testado, precisa_lar, necessidade, local, oculto, foto_path, foto_foco_x, foto_foco_y")
    .order("criado_em", { ascending: false })
    .order("nome");
  falhou("pets", error);
  return (data ?? []).map(({ foto_foco_x, foto_foco_y, ...p }) => ({ ...p, foto_foco: { x: foto_foco_x, y: foto_foco_y } }));
}

// Histórico de alterações (Mais), do mais recente para o mais antigo, de 10 em 10.
export type LinhaDoHistorico = {
  id: string;
  acao: "criou" | "alterou" | "cancelou";
  resumo: string;
  // valor da contribuição ou da despesa
  valor: number | null;
  // nome do administrador (null nas mudanças feitas fora do site, como o seed)
  quem: string | null;
  quando: string;
};
export type PaginaDoHistorico = { itens: LinhaDoHistorico[]; total: number; pagina: number };

export async function lerHistorico(pagina: number): Promise<PaginaDoHistorico> {
  const supabase = await cliente();
  const de = (pagina - 1) * POR_PAGINA;
  const [h, a] = await Promise.all([
    supabase
      .from("historico")
      .select("id, acao, resumo, quando, user_id, tabela, depois", { count: "exact" })
      .order("quando", { ascending: false })
      .order("id")
      .range(de, de + POR_PAGINA - 1),
    supabase.from("administradores").select("user_id, nome"),
  ]);
  falhou("historico", h.error);
  falhou("administradores", a.error);
  const nomes = new Map((a.data ?? []).map((x) => [x.user_id, x.nome]));
  return {
    total: h.count ?? 0,
    pagina,
    itens: (h.data ?? []).map((x) => {
      const depois = x.depois as { valor?: number } | null;
      return {
        id: x.id,
        acao: x.acao,
        resumo: x.resumo,
        valor: (x.tabela === "contribuicoes" || x.tabela === "despesas") && depois?.valor != null ? Number(depois.valor) : null,
        quem: x.user_id ? nomes.get(x.user_id) ?? null : null,
        quando: x.quando,
      };
    }),
  };
}
