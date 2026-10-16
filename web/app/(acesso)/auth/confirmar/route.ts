import { type NextRequest, NextResponse } from "next/server";
import { criarClienteServidor } from "@/lib/supabase/server";

// Link dos e-mails do Supabase (convite de administrador e redefinição de senha).
// O modelo do e-mail aponta para /auth/confirmar?token_hash=...&type=invite|recovery.
// Confirma o link, cria a sessão e leva para a tela de nova senha.
const TIPOS = new Set(["invite", "recovery"]);

export async function GET(request: NextRequest) {
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const tipo = request.nextUrl.searchParams.get("type");
  const erro = new URL("/entrar/nova-senha?link=invalido", request.url);

  if (!tokenHash || !tipo || !TIPOS.has(tipo)) return NextResponse.redirect(erro);

  const supabase = await criarClienteServidor();
  const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: tipo as "invite" | "recovery" });
  if (error) return NextResponse.redirect(erro);

  return NextResponse.redirect(new URL("/entrar/nova-senha", request.url));
}
