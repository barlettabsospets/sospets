import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { FormularioEntrar } from "@/components/auth/FormularioEntrar";
import { MSG_SEM_ACESSO, MSG_SESSAO_EXPIRADA } from "@/lib/auth/mensagens";

export const metadata: Metadata = { title: "Entrar" };

const AVISOS: Record<string, string> = { "sem-acesso": MSG_SEM_ACESSO, "sessao": MSG_SESSAO_EXPIRADA };

// Lê ?proximo= e ?aviso= (parâmetros só existem na hora do pedido, por isso o Suspense).
async function FormularioComParametros({ searchParams }: { searchParams: PageProps<"/entrar">["searchParams"] }) {
  const { proximo, aviso } = await searchParams;
  return (
    <FormularioEntrar
      proximo={typeof proximo === "string" ? proximo : undefined}
      avisoInicial={typeof aviso === "string" ? AVISOS[aviso] : null}
    />
  );
}

// Login da Área do administrador (login.html).
export default function Entrar({ searchParams }: PageProps<"/entrar">) {
  return (
    <div className="lg-wrap">
      <main id="main" className="lg-card">
        <Link className="lg-logo" href="/" aria-label="SOS Pets DF Águas Claras, voltar ao site">
          <Image src="/assets/logo-ilustracao.png" alt="" width={462} height={425} sizes="96px" preload />
          <span className="marca"><b>SOS Pets</b><small>DF Águas Claras</small></span>
        </Link>
        <div className="lg-h">
          <h1>Área do administrador</h1>
          <p>Entre para registrar contribuições, despesas e pets.</p>
        </div>
        <Suspense fallback={<FormularioEntrar />}>
          <FormularioComParametros searchParams={searchParams} />
        </Suspense>
        <p className="lg-help">
          Acesso restrito à equipe do SOS Pets. Esqueceu a senha? Peça a redefinição a quem administra o sistema.
        </p>
      </main>
      <Link className="tp-more lg-voltar" href="/">
        <svg viewBox="0 0 24 24" aria-hidden="true" style={{ transform: "rotate(180deg)" }}><path d="m9 5 7 7-7 7" /></svg>
        Voltar ao site
      </Link>
    </div>
  );
}
