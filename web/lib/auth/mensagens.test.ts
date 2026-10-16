import { describe, expect, it } from "vitest";
import { destinoDepoisDoLogin, mensagemDeErroDoLogin } from "./mensagens";

describe("mensagemDeErroDoLogin", () => {
  it("traduz os erros comuns do Supabase", () => {
    expect(mensagemDeErroDoLogin("invalid_credentials")).toBe("E-mail ou senha incorretos.");
    expect(mensagemDeErroDoLogin("over_request_rate_limit")).toMatch(/Muitas tentativas/);
  });

  it("erro desconhecido vira uma mensagem genérica em português", () => {
    expect(mensagemDeErroDoLogin("algo_novo")).toBe("Não foi possível entrar agora. Tente de novo em alguns minutos.");
    expect(mensagemDeErroDoLogin(undefined)).toMatch(/^Não foi possível entrar/);
  });
});

describe("destinoDepoisDoLogin", () => {
  it("aceita páginas do admin", () => {
    expect(destinoDepoisDoLogin("/admin/despesas")).toBe("/admin/despesas");
    expect(destinoDepoisDoLogin("/admin")).toBe("/admin");
  });

  it("recusa qualquer outro destino (evita redirecionar para fora do site)", () => {
    for (const ruim of ["//exemplo.com", "https://exemplo.com", "/administrador", "/admin/../entrar", "/", null, undefined, 3]) {
      expect(destinoDepoisDoLogin(ruim)).toBe("/admin/contribuicoes");
    }
  });
});
