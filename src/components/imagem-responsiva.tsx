import { assetUrl } from "@/lib/asset-url";
import manifesto from "@/lib/imagens-manifesto.json";

type Variante = { url: string; largura: number; bytes: number };
type Entrada = {
  largura: number;
  altura: number;
  original: string;
  avif: Variante[];
  webp: Variante[];
};

const IMAGENS = manifesto as Record<string, Entrada | undefined>;

function srcSet(variantes: Variante[]) {
  return variantes.map((v) => `${assetUrl(v.url)} ${v.largura}w`).join(", ");
}

type Props = {
  /** Caminho da foto original, exatamente como esta no asset.json. */
  src: string;
  alt: string;
  className?: string;
  /** Largura que a foto ocupa em cada tamanho de tela. */
  sizes?: string;
  /**
   * So a foto principal (a primeira que aparece na tela) deve ser prioritaria.
   * As demais entram com lazy loading, para nao baixarem todas de uma vez.
   */
  prioridade?: boolean;
  /** Repassado ao <img>, para fotos decorativas. */
  "aria-hidden"?: boolean;
};

/**
 * Serve a mesma fotografia em AVIF e WebP, no tamanho certo para cada tela,
 * com o JPEG original de reserva. A imagem exibida e a mesma de sempre —
 * muda so o peso do download.
 *
 * As copias otimizadas sao geradas por scripts/otimizar-imagens.mjs. Se uma
 * foto ainda nao estiver no manifesto, o componente serve o original.
 */
export function ImagemResponsiva({
  src,
  alt,
  className,
  sizes = "100vw",
  prioridade = false,
  "aria-hidden": ariaHidden,
}: Props) {
  const entrada = IMAGENS[src];

  const img = (
    <img
      src={assetUrl(entrada?.original ?? src)}
      alt={alt}
      aria-hidden={ariaHidden}
      width={entrada?.largura}
      height={entrada?.altura}
      sizes={entrada ? sizes : undefined}
      loading={prioridade ? "eager" : "lazy"}
      decoding={prioridade ? "sync" : "async"}
      fetchPriority={prioridade ? "high" : "auto"}
      className={className}
    />
  );

  if (!entrada) return img;

  return (
    <picture className="block h-full w-full">
      <source type="image/avif" srcSet={srcSet(entrada.avif)} sizes={sizes} />
      <source type="image/webp" srcSet={srcSet(entrada.webp)} sizes={sizes} />
      {img}
    </picture>
  );
}
