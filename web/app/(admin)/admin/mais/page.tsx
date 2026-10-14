import type { Metadata } from "next";

export const metadata: Metadata = { title: "Mais" };

// A tela de verdade vem na T5.3.
export default function Pagina() {
  return (
    <main id="main" className="wrap">
      <div className="ahead">
        <h1>Mais</h1>
        <p>Em construção.</p>
      </div>
    </main>
  );
}
