import { createClient } from "@supabase/supabase-js";
import type { Database } from "./tipos";

// Cliente das páginas públicas: só a anon key, sem cookies e sem sessão.
// Lê apenas as views pub_* (o RLS barra o resto). Por não depender de quem está
// logado, pode ser usado dentro de funções 'use cache'.
// Devolve null quando o Supabase não está configurado (ex.: build sem .env).
export function criarClientePublico() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const chave = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !chave) return null;
  return createClient<Database>(url, chave, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
