"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { criarClienteServidor } from "@/lib/supabase/server";
import { destinoDepoisDoLogin, MSG_CAMPOS_VAZIOS, MSG_SEM_ACESSO, mensagemDeErroDoLogin } from "./mensagens";

export type EstadoDoLogin = { erro: string | null; campo?: "email" | "senha"; email?: string };

const Login = z.object({
  email: z.string().trim().min(1),
  senha: z.string().min(1),
  proximo: z.string().optional(),
});

// Entra com e-mail e senha. Só quem está ativo em administradores continua logado.
export async function entrar(_anterior: EstadoDoLogin, dados: FormData): Promise<EstadoDoLogin> {
  const lido = Login.safeParse({
    email: dados.get("email") ?? "",
    senha: dados.get("senha") ?? "",
    proximo: dados.get("proximo") ?? undefined,
  });
  const email = String(dados.get("email") ?? "");
  if (!lido.success) {
    const campo = lido.error.issues[0]?.path[0] === "senha" ? "senha" : "email";
    return { erro: MSG_CAMPOS_VAZIOS, campo, email };
  }

  const supabase = await criarClienteServidor();
  const { error } = await supabase.auth.signInWithPassword({ email: lido.data.email, password: lido.data.senha });
  if (error) return { erro: mensagemDeErroDoLogin(error.code), campo: "senha", email };

  const { data: ehAdmin } = await supabase.rpc("eh_admin");
  if (!ehAdmin) {
    await supabase.auth.signOut();
    return { erro: MSG_SEM_ACESSO, campo: "email", email };
  }

  redirect(destinoDepoisDoLogin(lido.data.proximo));
}

export async function sair() {
  const supabase = await criarClienteServidor();
  await supabase.auth.signOut();
  redirect("/entrar");
}

export type EstadoDaNovaSenha = { erro: string | null; campo?: "senha" | "repetir" };

const NovaSenha = z
  .object({
    senha: z.string().min(8, "A senha precisa ter pelo menos 8 caracteres."),
    repetir: z.string(),
  })
  .refine((d) => d.senha === d.repetir, { message: "As duas senhas não são iguais.", path: ["repetir"] });

// Define a senha depois do link do e-mail (convite ou redefinição).
export async function salvarNovaSenha(_anterior: EstadoDaNovaSenha, dados: FormData): Promise<EstadoDaNovaSenha> {
  const lido = NovaSenha.safeParse({ senha: dados.get("senha") ?? "", repetir: dados.get("repetir") ?? "" });
  if (!lido.success) {
    const problema = lido.error.issues[0];
    return { erro: problema.message, campo: problema.path[0] === "repetir" ? "repetir" : "senha" };
  }

  const supabase = await criarClienteServidor();
  const { data: sessao } = await supabase.auth.getClaims();
  if (!sessao?.claims?.sub) {
    return { erro: "O link do e-mail expirou ou já foi usado. Peça um novo em “Esqueci minha senha”, na tela de entrar." };
  }

  const { error } = await supabase.auth.updateUser({ password: lido.data.senha });
  if (error) {
    const msg =
      error.code === "same_password" ? "A nova senha precisa ser diferente da anterior."
      : error.code === "weak_password" ? "Essa senha é fácil de adivinhar. Escolha outra, mais longa."
      : "Não foi possível salvar a senha agora. Tente de novo em alguns minutos.";
    return { erro: msg, campo: "senha" };
  }

  const { data: ehAdmin } = await supabase.rpc("eh_admin");
  if (!ehAdmin) {
    await supabase.auth.signOut();
    redirect("/entrar?aviso=sem-acesso");
  }
  redirect("/admin/contribuicoes");
}

export type EstadoDoPedido = { erro: string | null; enviado?: boolean; email?: string };

// "Esqueci minha senha": manda o link de redefinição (modelo do e-mail em supabase/templates/recuperar-senha.html).
// A resposta é a mesma, exista ou não o e-mail, para a página não revelar quem é da equipe.
export async function pedirNovaSenha(_anterior: EstadoDoPedido, dados: FormData): Promise<EstadoDoPedido> {
  const email = String(dados.get("email") ?? "").trim();
  if (!z.email().safeParse(email).success) return { erro: "Informe o e-mail com que você entra.", email };

  const supabase = await criarClienteServidor();
  const { error } = await supabase.auth.resetPasswordForEmail(email);
  if (error?.code === "over_email_send_rate_limit" || error?.code === "over_request_rate_limit") {
    return { erro: "Muitos pedidos seguidos. Espere alguns minutos e tente de novo.", email };
  }
  return { erro: null, enviado: true, email };
}
