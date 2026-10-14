import Link from "next/link";
import { IconeCadeado, IconeContas, IconeDespesas, IconePetsPublico } from "./icones";
import { LinkDaAba } from "./LinkDaAba";
import { Marca } from "./partes";

// Cabeçalho das páginas públicas (index.html, animais.html, despesas.html).
export function CabecalhoPublico() {
  return (
    <header className="thead">
      <div className="wrap th-in">
        <Marca href="/" rotulo="SOS Pets DF Águas Claras, página inicial" />
        <nav className="th-tabs" aria-label="Principal">
          <LinkDaAba href="/" aria-label="Prestação de contas">
            <IconeContas />
            <span className="full">Prestação de contas</span>
            <span className="short" aria-hidden="true">Contas</span>
          </LinkDaAba>
          <LinkDaAba href="/pets">
            <IconePetsPublico />
            Pets
          </LinkDaAba>
          <LinkDaAba href="/despesas">
            <IconeDespesas />
            Despesas
          </LinkDaAba>
        </nav>
        <Link className="th-admin" href="/entrar">
          <IconeCadeado />
          <span>Área do administrador</span>
        </Link>
      </div>
    </header>
  );
}
