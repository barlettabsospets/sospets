import type { Metadata } from "next";
import { ListaDespesas } from "@/components/publico/ListaDespesas";
import { lerDespesas, lerMesAtual } from "@/lib/dados/publico";

export const metadata: Metadata = {
  title: "Despesas",
  description: "Tudo o que o SOS Pets DF Águas Claras pagou com o dinheiro arrecadado, mês a mês, por categoria e por pet.",
};

// Despesas (despesas.html). Dados de pub_despesas, com cache de 5 minutos.
export default async function Despesas() {
  const [despesas, mesAtual] = await Promise.all([lerDespesas(), lerMesAtual()]);
  return <ListaDespesas despesas={despesas} mesAtual={mesAtual} />;
}
