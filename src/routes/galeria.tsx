import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { assetUrl } from "@/lib/asset-url";
import { SITE_URL } from "@/config/conteudo";
import { useAlbumPublico, useAlbunsPublicos } from "@/lib/cms/consultas";
import type { Foto } from "@/lib/cms/tipos";
import { formatarDia } from "@/lib/cms/util";
import { MOMENTO_DESTAQUE, momentos } from "@/lib/momentos";
import { useMontado } from "@/lib/use-montado";
import { ImagemResponsiva } from "@/components/imagem-responsiva";
import { Toaster } from "@/components/ui/sonner";
import { BotaoCompartilhar } from "@/components/site/compartilhar";
import { Lightbox } from "@/components/site/lightbox";
import manifesto from "@/lib/imagens-manifesto.json";
import logoWordmark from "@/assets/logo-wordmark-v2.asset.json";
import logoMonogram from "@/assets/logo-monogram-v2.asset.json";

/**
 * Galeria de fotos (/galeria).
 *
 * O album "Momentos" e fixo: sao as mesmas fotos da pagina inicial, entao a
 * galeria nunca abre vazia. Os demais albuns vem do painel /admin (Galeria
 * de fotos), e so aparecem quando publicados.
 */

const DESCRICAO =
  "Momentos especiais dos encontros Mulheres Curadas: adoração, abraços, oração e transformação.";

const SLUG_MOMENTOS = "momentos";

const MEDIDAS = manifesto as Record<string, { largura: number; altura: number } | undefined>;

/** As fotos dos "Momentos" no mesmo formato das fotos do painel. */
const FOTOS_MOMENTOS: Foto[] = [MOMENTO_DESTAQUE, ...momentos].map((m, i) => ({
  id: `momento-${i + 1}`,
  album_id: SLUG_MOMENTOS,
  url: assetUrl(m.asset.url),
  caminho: "",
  legenda: "",
  largura: MEDIDAS[m.asset.url]?.largura ?? null,
  altura: MEDIDAS[m.asset.url]?.altura ?? null,
  ordem: i,
  criado_em: "",
}));

export const Route = createFileRoute("/galeria")({
  // /galeria?album=slug abre um album.
  validateSearch: (busca: Record<string, unknown>): { album?: string } => ({
    album: typeof busca.album === "string" && busca.album ? busca.album : undefined,
  }),
  component: PaginaGaleria,
  head: () => ({
    meta: [
      { title: "Galeria de fotos — Mulheres Curadas" },
      { name: "description", content: DESCRICAO },
      { property: "og:title", content: "Galeria de fotos — Mulheres Curadas" },
      { property: "og:description", content: DESCRICAO },
      { property: "og:image", content: `${SITE_URL}/imagens/og-capa.jpg` },
      { property: "og:url", content: `${SITE_URL}/galeria/` },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/galeria/` }],
  }),
});

function PaginaGaleria() {
  const busca = Route.useSearch();
  // A pagina e pre-gerada sem o parametro: ler so depois de montar evita
  // diferenca entre o HTML pronto e a primeira pintura do React.
  const montado = useMontado();
  const album = montado ? busca.album : undefined;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-primary/10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6 md:px-12">
          <Link
            to="/"
            className="flex items-center gap-3"
            aria-label="Voltar para a página inicial"
          >
            <img
              src={assetUrl(logoMonogram.url)}
              alt=""
              aria-hidden="true"
              width={349}
              height={522}
              className="h-10 w-auto"
            />
            <img
              src={assetUrl(logoWordmark.url)}
              alt="Mulheres Curadas"
              width={746}
              height={266}
              className="h-7 w-auto"
            />
          </Link>
          <Link
            to={album ? "/galeria" : "/"}
            search={album ? {} : undefined}
            className="inline-flex min-h-[44px] items-center gap-2 text-xs uppercase tracking-[0.2em] text-primary/80 transition-colors hover:text-primary"
          >
            <ArrowLeft aria-hidden="true" className="h-4 w-4" />
            <span className="hidden sm:inline">{album ? "Galeria" : "Voltar"}</span>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-10 md:px-12 md:py-16">
        {album ? <Album slug={album} /> : <Albuns />}
      </main>
      <Toaster position="top-center" />
    </div>
  );
}

function Albuns() {
  const { data } = useAlbunsPublicos();
  const doPainel = data ?? [];

  return (
    <>
      <div className="mx-auto max-w-2xl text-center">
        <p className="eyebrow text-primary/80">Galeria de fotos</p>
        <h1 className="mt-6 text-display text-5xl leading-tight text-primary md:text-6xl">
          Momentos que <span className="italic">ficam.</span>
        </h1>
        <p className="mt-6 text-lg leading-relaxed text-foreground/70">{DESCRICAO}</p>
      </div>

      <ul className="mt-14 flex flex-wrap justify-center gap-6">
        {doPainel.map((a) => (
          <li key={a.id} className="w-full sm:w-[calc(50%-0.75rem)] lg:w-[calc(33.333%-1rem)]">
            <Link
              to="/galeria"
              search={{ album: a.slug }}
              className="group relative block aspect-[4/5] overflow-hidden rounded-3xl bg-muted"
            >
              {a.capa_url && (
                <img
                  src={a.capa_url}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-105"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-6 text-white">
                <p className="eyebrow text-white/75">
                  {formatarDia(a.data)} · {a.total} {a.total === 1 ? "foto" : "fotos"}
                </p>
                <p className="mt-2 text-display text-3xl leading-tight">{a.titulo}</p>
              </div>
            </Link>
          </li>
        ))}
        <li className="w-full sm:w-[calc(50%-0.75rem)] lg:w-[calc(33.333%-1rem)]">
          <Link
            to="/galeria"
            search={{ album: SLUG_MOMENTOS }}
            className="group relative block aspect-[4/5] overflow-hidden rounded-3xl bg-muted"
          >
            <ImagemResponsiva
              src={MOMENTO_DESTAQUE.asset.url}
              alt=""
              sizes="(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw"
              className="h-full w-full object-cover object-top transition-transform duration-[1.2s] ease-out group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-6 text-white">
              <p className="eyebrow text-white/75">{FOTOS_MOMENTOS.length} fotos</p>
              <p className="mt-2 text-display text-3xl leading-tight">Momentos</p>
            </div>
          </Link>
        </li>
      </ul>
    </>
  );
}

function Album({ slug }: { slug: string }) {
  const fixo = slug === SLUG_MOMENTOS;
  const { data, isLoading } = useAlbumPublico(fixo ? "" : slug);
  const [aberta, setAberta] = useState<number | null>(null);

  const titulo = fixo ? "Momentos" : data?.album.titulo;
  const descricao = fixo ? "Os encontros Mulheres Curadas em imagens." : data?.album.descricao;
  const selo = fixo ? "Galeria de fotos" : data ? formatarDia(data.album.data) : "";
  const fotos: Foto[] = fixo ? FOTOS_MOMENTOS : (data?.fotos ?? []);

  if (!fixo && isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="aspect-[4/5] animate-pulse rounded-3xl bg-[color:color-mix(in_oklch,var(--rose-soft)_15%,var(--cream))]"
          />
        ))}
      </div>
    );
  }
  if (!fixo && !data) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <p className="text-display text-3xl text-primary">Álbum não encontrado.</p>
        <Link
          to="/galeria"
          className="mt-6 inline-flex min-h-[44px] items-center gap-2 text-xs uppercase tracking-[0.25em] text-primary"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Ver todos os álbuns
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="mx-auto max-w-3xl text-center">
        <p className="eyebrow text-primary/80">{selo}</p>
        <h1 className="mt-6 text-display text-5xl leading-tight text-primary md:text-6xl">
          {titulo}
        </h1>
        {descricao && (
          <p className="mt-5 text-lg leading-relaxed text-foreground/70">{descricao}</p>
        )}
        <div className="mt-8 flex justify-center">
          <BotaoCompartilhar titulo={`${titulo} — Mulheres Curadas`} />
        </div>
      </div>

      {/* Grade editorial em colunas: cada foto na proporcao original, sem corte. */}
      <ul className="mt-12 columns-2 gap-3 md:columns-3 md:gap-5 xl:columns-4">
        {fotos.map((f, i) => (
          <li key={f.id} className="mb-3 break-inside-avoid md:mb-5">
            <button
              type="button"
              onClick={() => setAberta(i)}
              className="group block w-full overflow-hidden rounded-2xl bg-muted"
              aria-label={`Ampliar foto ${i + 1}${f.legenda ? `: ${f.legenda}` : ""}`}
            >
              <img
                src={f.url}
                alt={f.legenda}
                loading={i < 4 ? "eager" : "lazy"}
                width={f.largura ?? undefined}
                height={f.altura ?? undefined}
                className="h-auto w-full transition-transform duration-700 group-hover:scale-[1.03]"
              />
            </button>
            {f.legenda && (
              <p className="mt-2 px-1 text-sm italic text-foreground/60">{f.legenda}</p>
            )}
          </li>
        ))}
      </ul>

      {aberta !== null && (
        <Lightbox
          fotos={fotos}
          indice={aberta}
          aoMudar={setAberta}
          aoFechar={() => setAberta(null)}
          tituloAlbum={titulo ?? "Galeria"}
        />
      )}
    </>
  );
}
