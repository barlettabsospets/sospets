import { type Bucket, urlDaFoto } from "@/lib/dominio/fotos";

// Foto de pet ou campanha vinda do Storage. As fotos já chegam reduzidas (lib/fotos/reduzir.ts),
// então vão direto, sem o otimizador do next/image; o tamanho na tela vem do CSS do protótipo.
export function Foto({ bucket, caminho, alt, className }: { bucket: Bucket; caminho: string; alt: string; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className={className}
      src={urlDaFoto(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "", bucket, caminho)}
      alt={alt}
      loading="lazy"
      decoding="async"
    />
  );
}
