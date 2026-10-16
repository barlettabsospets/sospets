import Link from "next/link";
import { mesPorExtenso } from "@/lib/dominio/formatacao";
import { paraMes } from "@/lib/dominio/meses";
import { lerDadosDesde } from "@/lib/dados/publico";

// Rodapé das páginas públicas, com "Dados registrados desde" vindo de pub_config.
export async function RodapePublico() {
  const desde = await lerDadosDesde();
  return (
    <footer className="site-foot">
      <div className="wrap">
        <p>
          <strong>Os números são públicos, as pessoas não.</strong> Nomes de quem contribui nunca aparecem neste site.
        </p>
        <p>
          {desde && <>Dados registrados desde {mesPorExtenso(paraMes(desde))}. </>}
          Dúvidas ou sugestões? Fale com a gente pelo Instagram @sospets_aguasclaras.
        </p>
        <p>
          <Link href="/entrar">Área do administrador</Link>
        </p>
      </div>
    </footer>
  );
}
