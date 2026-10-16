import Link from "next/link";
import { Suspense } from "react";
import { sair } from "@/lib/auth/acoes";
import { lerAdministradorAtual } from "@/lib/dados/admin";
import {
  IconeContribuicoes, IconeDespesas, IconeMais, IconeMembros, IconePetsAdmin, IconeSair,
} from "./icones";
import { LinkDaAba } from "./LinkDaAba";
import { Marca } from "./partes";

const ABAS = [
  { href: "/admin/contribuicoes", rotulo: "Contribuições", Icone: IconeContribuicoes },
  { href: "/admin/despesas", rotulo: "Despesas", Icone: IconeDespesas },
  { href: "/admin/pets", rotulo: "Pets", Icone: IconePetsAdmin },
  { href: "/admin/membros", rotulo: "Membros", Icone: IconeMembros },
  { href: "/admin/mais", rotulo: "Mais", Icone: IconeMais, tambem: ["/admin/campanhas", "/admin/conta"] },
];

const Abas = () =>
  ABAS.map(({ href, rotulo, Icone, tambem }) => (
    <LinkDaAba key={href} href={href} tambem={tambem}>
      <Icone />
      <span>{rotulo}</span>
    </LinkDaAba>
  ));

// "Olá, Ana!" com o primeiro nome de quem entrou; leva a "Minha conta" (não existe no protótipo).
// Lê a sessão, então fica num <Suspense> e não atrasa o resto da página.
async function Saudacao() {
  const admin = await lerAdministradorAtual();
  if (!admin) return null;
  return (
    <Link className="th-ola" href="/admin/conta">
      Olá, {admin.nome.trim().split(/\s+/)[0]}!<span className="sr-only"> Minha conta</span>
    </Link>
  );
}

// Cabeçalho da área do administrador (abas, saudação e "Sair").
export function CabecalhoAdmin() {
  return (
    <header className="thead">
      <div className="wrap th-in">
        <Marca href="/admin/contribuicoes" rotulo="SOS Pets DF Águas Claras, início da área do administrador" />
        <nav className="th-tabs" aria-label="Área do administrador">
          <Abas />
        </nav>
        <div className="th-conta">
          <Suspense fallback={null}>
            <Saudacao />
          </Suspense>
          <form className="th-sair" action={sair}>
            <button className="th-admin" type="submit">
              <IconeSair />
              <span>Sair</span>
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}

// As mesmas abas, fixas embaixo no celular.
export function TabbarAdmin() {
  return (
    <nav className="tabbar" aria-label="Área do administrador">
      <Abas />
    </nav>
  );
}
