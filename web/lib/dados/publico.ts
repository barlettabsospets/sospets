import { cacheLife, cacheTag } from "next/cache";
import { type Mes, mesAtual, paraMes } from "@/lib/dominio/meses";
import type { PetDoPainel } from "@/lib/dominio/pets";
import type { ResumoDoMes } from "@/lib/dominio/saldo";
import { criarClientePublico } from "@/lib/supabase/publico";

// Dados das páginas públicas, lidos das views pub_* com cache:
// valem por 5 minutos (ISR da SPEC) e são renovados na hora quando o admin salva algo
// (as Server Actions chamam updateTag(ETIQUETA_PUBLICO)).
// As views devolvem colunas que podem ser nulas; aqui viram tipos sem nulos.
export const ETIQUETA_PUBLICO = "publico";

function cliente() {
  const supabase = criarClientePublico();
  if (!supabase) throw new Error("Supabase não configurado (NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY).");
  return supabase;
}

function falhou(view: string, error: { message: string } | null) {
  if (error) throw new Error(`Não foi possível ler ${view}: ${error.message}`);
}

// "Dados registrados desde…" do rodapé. null se o Supabase não estiver configurado.
export async function lerDadosDesde(): Promise<string | null> {
  "use cache";
  cacheLife({ stale: 300, revalidate: 300, expire: 86400 });
  cacheTag(ETIQUETA_PUBLICO);

  const supabase = criarClientePublico();
  if (!supabase) return null;
  const { data, error } = await supabase.from("pub_config").select("dados_desde").maybeSingle();
  falhou("pub_config", error);
  return data?.dados_desde ?? null;
}

// O mês de hoje (Brasília), guardado junto com os dados: a página e os números
// mudam de mês juntos, quando o cache é renovado.
export async function lerMesAtual(): Promise<Mes> {
  "use cache";
  cacheLife({ stale: 300, revalidate: 300, expire: 86400 });
  cacheTag(ETIQUETA_PUBLICO);
  return mesAtual();
}

// pub_resumo_mensal: um item por mês, de dados_desde até hoje, em ordem.
export async function lerResumoMensal(): Promise<(ResumoDoMes & { mes: Mes })[]> {
  "use cache";
  cacheLife({ stale: 300, revalidate: 300, expire: 86400 });
  cacheTag(ETIQUETA_PUBLICO);

  const { data, error } = await cliente().from("pub_resumo_mensal").select("*").order("mes");
  falhou("pub_resumo_mensal", error);
  return (data ?? []).map((r) => ({
    mes: paraMes(r.mes!),
    entrou: r.entrou ?? 0,
    saiu: r.saiu ?? 0,
    contribuicoes: r.contribuicoes ?? 0,
    despesas: r.despesas ?? 0,
  }));
}

export type GastoDaCategoria = { mes: Mes; categoria: string; cor: string; ordem: number; total: number };

// pub_gasto_categoria_mes: quanto saiu por categoria em cada mês.
export async function lerGastosPorCategoria(): Promise<GastoDaCategoria[]> {
  "use cache";
  cacheLife({ stale: 300, revalidate: 300, expire: 86400 });
  cacheTag(ETIQUETA_PUBLICO);

  const { data, error } = await cliente().from("pub_gasto_categoria_mes").select("mes, categoria, cor, ordem, total");
  falhou("pub_gasto_categoria_mes", error);
  return (data ?? []).map((r) => ({
    mes: paraMes(r.mes!),
    categoria: r.categoria!,
    cor: r.cor!,
    ordem: r.ordem ?? 0,
    total: r.total ?? 0,
  }));
}

export type DespesaPublica = {
  id: string;
  data: string;
  descricao: string;
  categoria: string;
  cor: string;
  valor: number;
  petId: string | null;
  // "Vários pets" quando não é de um pet só (ou o pet está oculto)
  pet: string;
  especie: "cachorro" | "gato" | null;
  campanhaId: string | null;
};

// pub_despesas, da mais recente para a mais antiga (limite opcional).
export async function lerDespesas(limite?: number): Promise<DespesaPublica[]> {
  "use cache";
  cacheLife({ stale: 300, revalidate: 300, expire: 86400 });
  cacheTag(ETIQUETA_PUBLICO);

  let consulta = cliente().from("pub_despesas").select("*").order("data", { ascending: false }).order("id");
  if (limite) consulta = consulta.limit(limite);
  const { data, error } = await consulta;
  falhou("pub_despesas", error);
  return (data ?? []).map((r) => ({
    id: r.id!,
    data: r.data!,
    descricao: r.descricao!,
    categoria: r.categoria!,
    cor: r.cor!,
    valor: r.valor ?? 0,
    petId: r.pet_id,
    pet: r.pet ?? "Vários pets",
    especie: r.especie,
    campanhaId: r.campanha_id,
  }));
}

export type PetPublico = PetDoPainel & {
  id: string;
  nome: string;
  sexo: "f" | "m";
  faixa_idade: "filhote" | "adulto";
  pelagem: string | null;
  castrado: "sim" | "nao" | "nao_sei";
  vacinado: boolean;
  vermifugado: boolean;
  fiv_felv_testado: boolean;
  precisa_lar: boolean;
  necessidade: string | null;
  foto_path: string | null;
};

// pub_pets: só os visíveis no site, sem o local.
export async function lerPets(): Promise<PetPublico[]> {
  "use cache";
  cacheLife({ stale: 300, revalidate: 300, expire: 86400 });
  cacheTag(ETIQUETA_PUBLICO);

  const { data, error } = await cliente().from("pub_pets").select("*").order("entrou_em").order("nome");
  falhou("pub_pets", error);
  return (data ?? []).map((r) => ({
    id: r.id!,
    nome: r.nome!,
    especie: r.especie!,
    sexo: r.sexo!,
    faixa_idade: r.faixa_idade!,
    pelagem: r.pelagem,
    entrou_em: r.entrou_em!,
    lar_em: r.lar_em,
    adotado_em: r.adotado_em,
    obito_em: r.obito_em,
    castrado: r.castrado ?? "nao_sei",
    castrado_em: r.castrado_em,
    vacinado: r.vacinado ?? false,
    vermifugado: r.vermifugado ?? false,
    fiv_felv_testado: r.fiv_felv_testado ?? false,
    precisa_lar: r.precisa_lar ?? false,
    necessidade: r.necessidade,
    foto_path: r.foto_path,
  }));
}

export type CampanhaPublica = {
  id: string;
  nome: string;
  descricao: string | null;
  meta: number | null;
  inicio: string;
  aberta: boolean;
  fotoPath: string | null;
  arrecadado: number;
  gasto: number;
};

// pub_campanhas: as em andamento primeiro, das mais novas para as mais antigas.
export async function lerCampanhas(): Promise<CampanhaPublica[]> {
  "use cache";
  cacheLife({ stale: 300, revalidate: 300, expire: 86400 });
  cacheTag(ETIQUETA_PUBLICO);

  const { data, error } = await cliente().from("pub_campanhas").select("*").order("inicio", { ascending: false });
  falhou("pub_campanhas", error);
  return (data ?? [])
    .map((r) => ({
      id: r.id!,
      nome: r.nome!,
      descricao: r.descricao,
      meta: r.meta,
      inicio: r.inicio!,
      aberta: r.situacao === "em_andamento",
      fotoPath: r.foto_path,
      arrecadado: r.arrecadado ?? 0,
      gasto: r.gasto ?? 0,
    }))
    .sort((a, b) => Number(b.aberta) - Number(a.aberta));
}
