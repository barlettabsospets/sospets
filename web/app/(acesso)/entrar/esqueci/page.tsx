import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { FormularioEsqueci } from "@/components/auth/FormularioEsqueci";

export const metadata: Metadata = { title: "Esqueci minha senha" };

// Esqueci minha senha (T3.4). Não existe no protótipo: usa o mesmo cartão do login.html.
export default function Esqueci() {
  return (
    <div className="lg-wrap">
      <main id="main" className="lg-card">
        <Link className="lg-logo" href="/" aria-label="SOS Pets DF Águas Claras, voltar ao site">
          <Image src="/assets/logo-ilustracao.png" alt="" width={462} height={425} sizes="96px" preload />
          <span className="marca"><b>SOS Pets</b><small>DF Águas Claras</small></span>
        </Link>
        <div className="lg-h">
          <h1>Esqueci minha senha</h1>
          <p>Digite o e-mail com que você entra. Vamos mandar um link para você criar uma nova senha.</p>
        </div>
        <FormularioEsqueci />
      </main>
      <Link className="tp-more lg-voltar" href="/entrar">
        <svg viewBox="0 0 24 24" aria-hidden="true" style={{ transform: "rotate(180deg)" }}><path d="m9 5 7 7-7 7" /></svg>
        Voltar ao login
      </Link>
    </div>
  );
}
