// Só para o GitHub Actions (T7.2): cria um administrador de teste no Supabase LOCAL e descartável
// do workflow, com uma senha aleatória, e passa e-mail e senha para os passos seguintes (E2E_EMAIL, E2E_SENHA).
// Recusa qualquer banco que não seja o local.
import { randomBytes } from "node:crypto";
import { appendFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
if (!/^http:\/\/(127\.0\.0\.1|localhost):/.test(url)) throw new Error(`Só roda no Supabase local, não em ${url}`);
if (!process.env.GITHUB_ENV) throw new Error("Só roda dentro do GitHub Actions.");

const s = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const email = "e2e@exemplo.com";
const senha = randomBytes(18).toString("base64url");
const { data, error } = await s.auth.admin.createUser({ email, password: senha, email_confirm: true });
if (error) throw error;
const r = await s.from("administradores").insert({ user_id: data.user.id, nome: "Teste Automatizado", ativo: true });
if (r.error) throw r.error;

// a senha não aparece no log
console.log(`::add-mask::${senha}`);
appendFileSync(process.env.GITHUB_ENV, `E2E_EMAIL=${email}\nE2E_SENHA=${senha}\n`);
console.log("Administrador de teste criado no Supabase local.");
