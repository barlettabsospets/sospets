import type { Metadata } from "next";
import { Suspense } from "react";
import { TrocarSenha } from "@/components/admin/TrocarSenha";
import { lerAdministradorAtual } from "@/lib/dados/admin";

export const metadata: Metadata = { title: "Minha conta" };

// o e-mail depende da sessão (cookies), então fica dentro do <Suspense>
async function Email() {
  const admin = await lerAdministradorAtual();
  return <p className="ad-conta-email">{admin?.email}</p>;
}

// Minha conta (T5.9; não existe no protótipo, aprovada pela Barbara em 15/10): trocar a senha
// e ver o e-mail. Mesmo visual das seções da tela Mais.
export default function Pagina() {
  return (
    <main id="main" className="wrap">
      <div className="ahead">
        <h1>Minha conta</h1>
        <p>Troque a sua senha e confira o e-mail com que você entra.</p>
      </div>
      <div className="ad-conta">
        <section className="sec tile" aria-labelledby="t-senha">
          <h2 id="t-senha">Trocar senha</h2>
          <TrocarSenha />
        </section>
        <section className="sec tile" aria-labelledby="t-email">
          <h2 id="t-email">E-mail</h2>
          <Suspense fallback={<p className="ad-conta-email">&nbsp;</p>}>
            <Email />
          </Suspense>
          <p className="muted">Para trocar o e-mail, peça a quem administra o sistema.</p>
        </section>
      </div>
    </main>
  );
}
