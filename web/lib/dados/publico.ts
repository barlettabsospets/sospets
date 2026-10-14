import { cacheLife, cacheTag } from "next/cache";
import { criarClientePublico } from "@/lib/supabase/publico";

// Dados das páginas públicas, lidos das views pub_* com cache:
// valem por 5 minutos (ISR da SPEC) e são renovados na hora quando o admin salva algo
// (as Server Actions chamam updateTag(ETIQUETA_PUBLICO)).
export const ETIQUETA_PUBLICO = "publico";

// "Dados registrados desde…" do rodapé. null se o Supabase não estiver configurado.
export async function lerDadosDesde(): Promise<string | null> {
  "use cache";
  cacheLife({ stale: 300, revalidate: 300, expire: 86400 });
  cacheTag(ETIQUETA_PUBLICO);

  const supabase = criarClientePublico();
  if (!supabase) return null;
  const { data, error } = await supabase.from("pub_config").select("dados_desde").maybeSingle();
  if (error) throw new Error(`Não foi possível ler pub_config: ${error.message}`);
  return data?.dados_desde ?? null;
}
