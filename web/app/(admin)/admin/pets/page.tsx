import type { Metadata } from "next";

export const metadata: Metadata = { title: "Pets" };

// A tela de verdade vem na T5.7.
export default function Pagina() {
  return (
    <main id="main" className="wrap">
      <div className="ahead">
        <h1>Pets</h1>
        <p>Em construção.</p>
      </div>
    </main>
  );
}
