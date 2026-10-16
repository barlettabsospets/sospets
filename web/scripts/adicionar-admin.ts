// Liga um usuário do Supabase Auth à tabela administradores (ou reativa/renomeia).
// Uso (dentro de web/):
//   node --env-file=.env.local scripts/adicionar-admin.ts <email> "<Nome que aparece no histórico>"
//   node --env-file=.env.local scripts/adicionar-admin.ts <email> --desativar
//   node --env-file=.env.local scripts/adicionar-admin.ts <email> --senha-temporaria
// O usuário precisa existir antes (Supabase → Authentication → Users → Add user).
// Grava no projeto do .env.local. Produção só com PRODUCAO=sim na frente do comando.
// Só --senha-temporaria mostra uma senha (gerada aqui): rode você mesmo, no seu terminal.

import { randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../lib/supabase/tipos.ts";

const REF_PRODUCAO = "rplzjprdzylzwgjsfmbc";

async function main() {
  const [email, nomeOuOpcao] = process.argv.slice(2);
  const desativar = nomeOuOpcao === "--desativar";
  const senhaTemporaria = nomeOuOpcao === "--senha-temporaria";
  if (!email || !nomeOuOpcao) {
    console.error('Uso: scripts/adicionar-admin.ts <email> "<Nome>" | --desativar | --senha-temporaria');
    process.exit(1);
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const chave = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !chave) throw new Error("Faltam NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no ambiente.");
  const ref = new URL(url).hostname.split(".")[0];
  if (ref === REF_PRODUCAO && process.env.PRODUCAO !== "sim") {
    throw new Error("Este é o projeto de PRODUÇÃO. Para continuar, rode de novo com PRODUCAO=sim na frente.");
  }
  console.log(`Projeto: ${ref}${ref === REF_PRODUCAO ? " (PRODUÇÃO)" : ""}`);

  const supabase = createClient<Database>(url, chave, { auth: { persistSession: false } });

  // procura o usuário pelo e-mail (paginando, para projetos com muitos usuários)
  let usuario: { id: string; email?: string } | undefined;
  for (let pagina = 1; !usuario; pagina++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page: pagina, perPage: 200 });
    if (error) throw error;
    usuario = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (data.users.length < 200) break;
  }
  if (!usuario) throw new Error(`Nenhum usuário com o e-mail ${email}. Crie antes em Authentication → Users → Add user.`);

  // quem esqueceu a senha: gera uma temporária, para trocar em /entrar/nova-senha
  if (senhaTemporaria) {
    const senha = randomBytes(9).toString("base64url");
    const { error } = await supabase.auth.admin.updateUserById(usuario.id, { password: senha });
    if (error) throw error;
    console.log(`Senha temporária de ${email}: ${senha}`);
    console.log("Passe por um canal privado. A pessoa troca em /entrar/nova-senha depois de entrar.");
    return;
  }

  if (desativar) {
    const { error } = await supabase.from("administradores").update({ ativo: false }).eq("user_id", usuario.id);
    if (error) throw error;
    console.log(`Desativado: ${email}. Não entra mais na área do administrador.`);
    return;
  }

  const { error } = await supabase
    .from("administradores")
    .upsert({ user_id: usuario.id, nome: nomeOuOpcao, ativo: true }, { onConflict: "user_id" });
  if (error) throw error;
  console.log(`Administrador ativo: ${nomeOuOpcao} <${email}>`);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
