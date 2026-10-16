import type { ComponentProps, ReactNode } from "react";

const juntar = (...classes: (string | false | undefined | null)[]) => classes.filter(Boolean).join(" ");

// Botão do protótipo: .btn + variante (.btn-primary, .btn-secondary, .btn-ghost) e .btn-sm.
export function Botao({
  variante = "primario",
  pequeno,
  className,
  type = "button",
  ...props
}: ComponentProps<"button"> & { variante?: "primario" | "secundario" | "fantasma"; pequeno?: boolean }) {
  const v = { primario: "btn-primary", secundario: "btn-secondary", fantasma: "btn-ghost" }[variante];
  return <button type={type} className={juntar("btn", v, pequeno && "btn-sm", className)} {...props} />;
}

// Cartão das páginas públicas: <section class="card"> com cabeçalho .card-h e rodapé .card-foot.
export function Cartao({
  idDoTitulo,
  titulo,
  cabecalho,
  rodape,
  className,
  children,
  ...props
}: Omit<ComponentProps<"section">, "title"> & {
  idDoTitulo: string;
  titulo: ReactNode;
  // conteúdo extra no cabeçalho, ao lado do título (ex.: link "Ver todas")
  cabecalho?: ReactNode;
  rodape?: ReactNode;
}) {
  return (
    <section className={juntar("card", className)} aria-labelledby={idDoTitulo} {...props}>
      <div className="card-h">
        <h2 id={idDoTitulo}>{titulo}</h2>
        {cabecalho}
      </div>
      {children}
      {rodape && <div className="card-foot">{rodape}</div>}
    </section>
  );
}

// Etiqueta: .chip com variante (chip-ok, chip-off...).
export function Chip({ tipo, className, ...props }: ComponentProps<"span"> & { tipo?: string }) {
  return <span className={juntar("chip", tipo && `chip-${tipo}`, className)} {...props} />;
}

export { juntar };
