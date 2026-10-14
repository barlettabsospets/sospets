import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { FormularioNovaSenha } from "@/components/auth/FormularioNovaSenha";

export const metadata: Metadata = { title: "Nova senha" };

const LINK_INVALIDO = "O link do e-mail expirou ou já foi usado. Peça um novo link a quem administra o sistema.";

async function FormularioComParametros({ searchParams }: { searchParams: PageProps<"/entrar/nova-senha">["searchParams"] }) {
  const { link } = await searchParams;
  return <FormularioNovaSenha avisoInicial={link === "invalido" ? LINK_INVALIDO : null} />;
}

// Definir a senha (convite de administrador ou redefinição). Não existe no protótipo:
// usa o mesmo cartão do login.html.
export default function NovaSenha({ searchParams }: PageProps<"/entrar/nova-senha">) {
  return (
    <div className="lg-wrap">
      <main id="main" className="lg-card">
        <Link className="lg-logo" href="/" aria-label="SOS Pets DF Águas Claras, voltar ao site">
          <Image src="/assets/logo-ilustracao.png" alt="" width={462} height={425} sizes="96px" preload />
          <span className="marca"><b>SOS Pets</b><small>DF Águas Claras</small></span>
        </Link>
        <div className="lg-h">
          <h1>Nova senha</h1>
          <p>Escolha a senha que você vai usar para entrar na área do administrador.</p>
        </div>
        <Suspense fallback={<FormularioNovaSenha />}>
          <FormularioComParametros searchParams={searchParams} />
        </Suspense>
      </main>
      <Link className="tp-more lg-voltar" href="/entrar">
        <svg viewBox="0 0 24 24" aria-hidden="true" style={{ transform: "rotate(180deg)" }}><path d="m9 5 7 7-7 7" /></svg>
        Voltar ao login
      </Link>
    </div>
  );
}
