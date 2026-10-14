import type { Metadata } from "next";

export const metadata: Metadata = { title: "Pets" };

// A página de verdade vem na T4.2.
export default function Pagina() {
  return (
    <main id="main" className="wrap tp">
      <header className="tp-head">
        <div>
          <h1>Pets</h1>
          <p className="sub">Em construção.</p>
        </div>
      </header>
    </main>
  );
}
