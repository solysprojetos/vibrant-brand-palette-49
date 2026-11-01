import { useState } from "react";
import { useMontado } from "@/lib/use-montado";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Images } from "lucide-react";
import { SITE_URL } from "@/config/conteudo";
import { useAlbumPublico, useAlbunsPublicos } from "@/lib/cms/consultas";
import { formatarDia } from "@/lib/cms/util";
import { AberturaPagina, PaginaInterna } from "@/components/site/estrutura";
import { BotaoCompartilhar } from "@/components/site/compartilhar";
import { Lightbox } from "@/components/site/lightbox";

const DESCRICAO =
  "Momentos especiais dos encontros Mulheres Curadas: adoração, abraços, oração e transformação.";

export const Route = createFileRoute("/galeria")({
  validateSearch: (busca: Record<string, unknown>): { album?: string } => ({
    album: typeof busca.album === "string" && busca.album ? busca.album : undefined,
  }),
  component: PaginaGaleria,
  head: () => ({
    meta: [
      { title: "Galeria — Mulheres Curadas" },
      { name: "description", content: DESCRICAO },
      { property: "og:title", content: "Galeria — Mulheres Curadas" },
      { property: "og:description", content: DESCRICAO },
      { property: "og:url", content: `${SITE_URL}/galeria/` },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/galeria/` }],
  }),
});

function PaginaGaleria() {
  const busca = Route.useSearch();
  const montado = useMontado();
  const album = montado ? busca.album : undefined;
  return <PaginaInterna>{album ? <Album slug={album} /> : <Albuns />}</PaginaInterna>;
}

function Esqueleto({ quantidade = 6 }: { quantidade?: number }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
      {Array.from({ length: quantidade }, (_, i) => (
        <div
          key={i}
          className="aspect-[4/5] animate-pulse rounded-3xl bg-[color:color-mix(in_oklch,var(--rose-soft)_15%,var(--cream))]"
        />
      ))}
    </div>
  );
}

function Albuns() {
  const { data, isLoading, isError } = useAlbunsPublicos();

  return (
    <>
      <AberturaPagina selo="Galeria" titulo="Momentos que" enfase="ficam." texto={DESCRICAO} />
      <section className="mx-auto max-w-7xl px-6 md:px-12">
        {isLoading ? (
          <Esqueleto />
        ) : isError || !data?.length ? (
          <div className="mx-auto max-w-md rounded-3xl bg-card p-10 text-center shadow-sm ring-1 ring-primary/5">
            <Images className="mx-auto h-8 w-8 text-primary/40" aria-hidden="true" />
            <p className="mt-4 text-display text-2xl text-primary">Em breve, novos álbuns.</p>
            <p className="mt-2 text-sm text-foreground/60">
              Enquanto isso, veja os momentos na página inicial.
            </p>
            <a
              href={`${import.meta.env.BASE_URL}#momentos`}
              className="mt-6 inline-flex min-h-[44px] items-center text-xs uppercase tracking-[0.25em] text-primary underline-offset-8 hover:underline"
            >
              Ver momentos
            </a>
          </div>
        ) : (
          <ul className="flex flex-wrap justify-center gap-6">
            {data.map((a, i) => (
              <li
                key={a.id}
                className="animate-in fade-in slide-in-from-bottom-4 duration-700"
                style={{ animationDelay: `${i * 70}ms`, animationFillMode: "both" }}
              >
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
          </ul>
        )}
      </section>
    </>
  );
}

function Album({ slug }: { slug: string }) {
  const { data, isLoading } = useAlbumPublico(slug);
  const [aberta, setAberta] = useState<number | null>(null);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-6 pt-16 md:px-12">
        <Esqueleto />
      </div>
    );
  }
  if (!data) {
    return (
      <div className="mx-auto max-w-md px-6 py-24 text-center">
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

  const { album, fotos } = data;
  return (
    <>
      <div className="mx-auto max-w-7xl px-6 pt-10 md:px-12">
        <Link
          to="/galeria"
          className="inline-flex min-h-[44px] items-center gap-2 text-xs uppercase tracking-[0.25em] text-primary/80 hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Galeria
        </Link>
      </div>
      <AberturaPagina
        selo={formatarDia(album.data)}
        titulo={album.titulo}
        texto={album.descricao || undefined}
      />
      <div className="mb-10 flex justify-center">
        <BotaoCompartilhar titulo={`${album.titulo} — Mulheres Curadas`} />
      </div>
      {/* Grade editorial em colunas: cada foto na proporcao original, sem corte. */}
      <section className="mx-auto max-w-7xl px-4 md:px-12">
        <ul className="columns-2 gap-3 md:columns-3 md:gap-5 xl:columns-4">
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
      </section>
      {aberta !== null && (
        <Lightbox
          fotos={fotos}
          indice={aberta}
          aoMudar={setAberta}
          aoFechar={() => setAberta(null)}
          tituloAlbum={album.titulo}
        />
      )}
    </>
  );
}
