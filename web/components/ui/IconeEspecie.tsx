import Image from "next/image";

// Ícone redondo de cão ou gato ao lado do nome do pet. O nome da espécie vai para o
// leitor de tela, como no protótipo ("Luna (gato)").
export function IconeEspecie({ especie }: { especie: "cachorro" | "gato" }) {
  return (
    <Image
      className="ic-cao"
      src={especie === "cachorro" ? "/assets/icone-cachorro.webp" : "/assets/icone-gato.webp"}
      alt=""
      width={192}
      height={192}
      sizes="24px"
    />
  );
}
