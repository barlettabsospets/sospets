import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "./tipos";

const ehAreaAdmin = (caminho: string) => caminho === "/admin" || caminho.startsWith("/admin/");

// manda para o login, lembrando onde a pessoa queria ir
function paraOLogin(request: NextRequest, aviso?: string) {
  const url = request.nextUrl.clone();
  url.pathname = "/entrar";
  url.search = "";
  url.searchParams.set("proximo", request.nextUrl.pathname);
  if (aviso) url.searchParams.set("aviso", aviso);
  return NextResponse.redirect(url);
}

// Roda a cada requisição (proxy.ts): renova a sessão do Supabase e protege /admin/*.
export async function atualizarSessao(request: NextRequest) {
  const caminho = request.nextUrl.pathname;
  let response = NextResponse.next({ request });

  // Sem Supabase configurado, o site público funciona e o admin fica fechado.
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return ehAreaAdmin(caminho) ? paraOLogin(request) : response;
  }

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
          // Impede que o CDN guarde respostas com cookie de sessão.
          Object.entries(headers).forEach(([chave, valor]) => response.headers.set(chave, valor));
        },
      },
    },
  );

  // Não coloque código entre createServerClient e getClaims().
  const { data } = await supabase.auth.getClaims();
  const logado = Boolean(data?.claims?.sub);

  if (ehAreaAdmin(caminho)) {
    if (!logado) return paraOLogin(request);
    // logado, mas não é administrador ativo (ex.: foi desativado)
    const { data: ehAdmin } = await supabase.rpc("eh_admin");
    if (!ehAdmin) return paraOLogin(request, "sem-acesso");
  }

  // quem já entrou não precisa ver o login de novo
  if (caminho === "/entrar" && logado) {
    const { data: ehAdmin } = await supabase.rpc("eh_admin");
    if (ehAdmin) return NextResponse.redirect(new URL("/admin/contribuicoes", request.url));
  }

  return response;
}
