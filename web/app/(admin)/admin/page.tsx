import { redirect } from "next/navigation";

// /admin abre em Contribuições, a tela mais usada.
export default function InicioAdmin() {
  redirect("/admin/contribuicoes");
}
