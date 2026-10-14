import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Renova a sessão do Supabase a cada requisição (chamado em proxy.ts).
// A proteção de /admin/* entra aqui na T3.2.
export async function atualizarSessao(request: NextRequest) {
  let response = NextResponse.next({ request });

  // Sem Supabase configurado (.env.local vazio), segue sem sessão.
  // TODO(T3.2): em /admin/*, isso deve mandar para /entrar.
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return response;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
          // Impede que o CDN guarde respostas com cookie de sessão.
          Object.entries(headers).forEach(([chave, valor]) =>
            response.headers.set(chave, valor),
          );
        },
      },
    },
  );

  // Não coloque código entre createServerClient e getClaims().
  await supabase.auth.getClaims();

  return response;
}
