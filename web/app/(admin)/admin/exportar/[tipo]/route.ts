import { diaEmBrasilia } from "@/lib/dominio/contribuicoes";
import { gerarCsv, nomeDoArquivo } from "@/lib/dominio/csv";
import { lerPlanilha, PLANILHAS, type TipoDePlanilha } from "@/lib/dados/exportar";
import { criarClienteServidor } from "@/lib/supabase/server";

// "Exportar dados" (Mais): baixa a planilha CSV de doações, despesas, pets ou membros.
// O proxy já manda quem não entrou para o login; aqui, só administrador ativo baixa.
export async function GET(_pedido: Request, { params }: { params: Promise<{ tipo: string }> }) {
  const { tipo } = await params;
  if (!PLANILHAS.includes(tipo as TipoDePlanilha)) return new Response("Planilha não encontrada.", { status: 404 });

  const supabase = await criarClienteServidor();
  const { data: admin } = await supabase.rpc("eh_admin");
  if (!admin) return new Response("Só administradores podem exportar os dados.", { status: 403 });

  const { cabecalho, linhas } = await lerPlanilha(supabase, tipo as TipoDePlanilha);
  return new Response(gerarCsv(cabecalho, linhas), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${nomeDoArquivo(tipo, diaEmBrasilia(new Date().toISOString()))}"`,
      // dado privado: nenhum cache guarda a planilha
      "Cache-Control": "private, no-store",
    },
  });
}
