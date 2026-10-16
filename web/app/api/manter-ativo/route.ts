import { connection } from "next/server";
import { criarClientePublico } from "@/lib/supabase/publico";

// T6.7: a Vercel chama esta rota uma vez por dia (vercel.json → crons). O Supabase gratuito pausa o
// projeto depois de 7 dias sem uso; uma consulta pequena e pública (pub_config) conta como uso.
// Com CRON_SECRET definido na Vercel, só a própria Vercel consegue chamar (ela manda o segredo).
export async function GET(pedido: Request) {
  // sempre na hora do pedido, nunca uma resposta guardada do build
  await connection();
  const segredo = process.env.CRON_SECRET;
  if (segredo && pedido.headers.get("authorization") !== `Bearer ${segredo}`) {
    return Response.json({ ok: false }, { status: 401 });
  }
  const supabase = criarClientePublico();
  if (!supabase) return Response.json({ ok: false, erro: "Supabase não configurado." }, { status: 500 });
  const { error } = await supabase.from("pub_config").select("dados_desde").limit(1);
  if (error) return Response.json({ ok: false, erro: error.message }, { status: 502 });
  return Response.json({ ok: true, quando: new Date().toISOString() });
}
