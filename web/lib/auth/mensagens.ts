// Mensagens do login em português. O Supabase devolve códigos em inglês
// (https://supabase.com/docs/guides/auth/debugging/error-codes).

export const MSG_CAMPOS_VAZIOS = "Informe seu e-mail e a senha para entrar.";
export const MSG_SEM_ACESSO = "Este e-mail não tem acesso à área do administrador.";
export const MSG_SESSAO_EXPIRADA = "Sua sessão terminou. Entre de novo.";

export function mensagemDeErroDoLogin(codigo: string | undefined): string {
  switch (codigo) {
    case "invalid_credentials":
      return "E-mail ou senha incorretos.";
    case "email_not_confirmed":
      return "Este e-mail ainda não foi confirmado. Use o link que chegou no seu e-mail.";
    case "user_banned":
      return MSG_SEM_ACESSO;
    case "over_request_rate_limit":
    case "over_email_send_rate_limit":
      return "Muitas tentativas seguidas. Espere alguns minutos e tente de novo.";
    default:
      return "Não foi possível entrar agora. Tente de novo em alguns minutos.";
  }
}

// Para onde ir depois de entrar: só caminhos da área do administrador
// (nunca outro site, como "//exemplo.com" ou "https://...").
export function destinoDepoisDoLogin(proximo: unknown): string {
  if (typeof proximo === "string" && /^\/admin(\/[\w\-/]*)?$/.test(proximo)) return proximo;
  return "/admin/contribuicoes";
}
