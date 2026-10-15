import { sair } from "@/lib/auth/acoes";
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
  { href: "/admin/mais", rotulo: "Mais", Icone: IconeMais, tambem: ["/admin/campanhas"] },
];

const Abas = () =>
  ABAS.map(({ href, rotulo, Icone, tambem }) => (
    <LinkDaAba key={href} href={href} tambem={tambem}>
      <Icone />
      <span>{rotulo}</span>
    </LinkDaAba>
  ));

// Cabeçalho da área do administrador (abas + "Sair").
export function CabecalhoAdmin() {
  return (
    <header className="thead">
      <div className="wrap th-in">
        <Marca href="/admin/contribuicoes" rotulo="SOS Pets DF Águas Claras, início da área do administrador" />
        <nav className="th-tabs" aria-label="Área do administrador">
          <Abas />
        </nav>
        <form className="th-sair" action={sair}>
          <button className="th-admin" type="submit">
            <IconeSair />
            <span>Sair</span>
          </button>
        </form>
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
