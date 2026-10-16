"use server";

import { z } from "zod";
import { criarClienteServidor } from "@/lib/supabase/server";
import type { Resultado } from "./membros";

// "Minha conta": trocar a própria senha, pedindo a atual.
// O e-mail não muda por aqui: a confirmação pelo e-mail novo depende de envio de e-mail próprio (SMTP).

export type CampoDaSenha = "atual" | "nova" | "repetir";

const TrocaDeSenha = z
  .object({
    atual: z.string().min(1, "Digite a senha atual."),
    nova: z.string().min(8, "A nova senha precisa ter pelo menos 8 caracteres.").max(72, "A nova senha pode ter até 72 caracteres."),
    repetir: z.string(),
  })
  .refine((d) => d.nova === d.repetir, { message: "As duas senhas novas não são iguais.", path: ["repetir"] });

export async function trocarSenha(entrada: z.input<typeof TrocaDeSenha>): Promise<Resultado<null> & { campo?: CampoDaSenha }> {
  const lido = TrocaDeSenha.safeParse(entrada);
  if (!lido.success) {
    const problema = lido.error.issues[0];
    return { ok: false, erro: problema.message, campo: problema.path[0] as CampoDaSenha };
  }

  const supabase = await criarClienteServidor();
  const { data } = await supabase.auth.getClaims();
  const email = data?.claims?.email;
  if (!email) return { ok: false, erro: "Sua sessão expirou. Entre de novo para trocar a senha." };

  // confere a senha atual entrando de novo com ela (a sessão continua a mesma pessoa)
  const conferida = await supabase.auth.signInWithPassword({ email: String(email), password: lido.data.atual });
  if (conferida.error) return { ok: false, erro: "A senha atual não confere.", campo: "atual" };

  const { error } = await supabase.auth.updateUser({ password: lido.data.nova });
  if (error) {
    const erro =
      error.code === "same_password" ? "A nova senha precisa ser diferente da atual."
      : error.code === "weak_password" ? "Essa senha é fácil de adivinhar. Escolha outra, mais longa."
      : "Não foi possível trocar a senha agora. Tente de novo em alguns minutos.";
    return { ok: false, erro, campo: "nova" };
  }
  return { ok: true, dados: null };
}
