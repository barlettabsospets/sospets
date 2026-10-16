"use server";

import { z } from "zod";
import { lerHistorico, type PaginaDoHistorico } from "@/lib/dados/admin";
import type { Resultado } from "./membros";

// Outras páginas do histórico de alterações (a primeira vem com a tela Mais).
export async function paginaDoHistorico(entrada: { pagina: number }): Promise<Resultado<PaginaDoHistorico>> {
  const lido = z.object({ pagina: z.number().int().min(1).max(100_000) }).safeParse(entrada);
  if (!lido.success) return { ok: false, erro: "Página inválida." };
  try {
    return { ok: true, dados: await lerHistorico(lido.data.pagina) };
  } catch {
    return { ok: false, erro: "Não foi possível carregar o histórico agora. Confira a conexão e tente de novo." };
  }
}
