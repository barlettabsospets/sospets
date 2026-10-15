"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentProps } from "react";

// Link de aba que marca aria-current="page" quando é a página aberta.
// "/" só na página inicial; as outras também nas subpáginas (ex.: /admin/pets/123)
// e nas páginas listadas em `tambem` (ex.: Campanhas, que se abre pelo "Mais").
export function LinkDaAba({ href, tambem = [], ...props }: ComponentProps<typeof Link> & { href: string; tambem?: string[] }) {
  const caminho = usePathname();
  const dentro = (h: string) => caminho === h || caminho.startsWith(`${h}/`);
  const atual = href === "/" ? caminho === "/" : [href, ...tambem].some(dentro);
  return <Link href={href} aria-current={atual ? "page" : undefined} {...props} />;
}
