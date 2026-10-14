import Image from "next/image";
import Link from "next/link";

// Faixa do topo em homologação (no lugar da faixa "Protótipo" do protótipo). Em produção, nada.
export function FaixaDoAmbiente() {
  if (process.env.NEXT_PUBLIC_AMBIENTE !== "homolog") return null;
  return <div className="proto">Ambiente de homologação</div>;
}

export function PularParaConteudo() {
  return <a className="skip" href="#main">Pular para o conteúdo</a>;
}

// Logo + "SOS Pets / DF Águas Claras".
export function Marca({ href, rotulo }: { href: string; rotulo: string }) {
  return (
    <Link className="th-brand" href={href} aria-label={rotulo}>
      <Image src="/assets/logo-ilustracao.png" alt="" width={462} height={425} sizes="80px" preload />
      <span className="marca"><b>SOS Pets</b><small>DF Águas Claras</small></span>
    </Link>
  );
}
