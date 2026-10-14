"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentProps } from "react";

// Link de aba que marca aria-current="page" quando é a página aberta.
// "/" só na página inicial; as outras também nas subpáginas (ex.: /admin/pets/123).
export function LinkDaAba({ href, ...props }: ComponentProps<typeof Link> & { href: string }) {
  const caminho = usePathname();
  const atual = href === "/" ? caminho === "/" : caminho === href || caminho.startsWith(`${href}/`);
  return <Link href={href} aria-current={atual ? "page" : undefined} {...props} />;
}
