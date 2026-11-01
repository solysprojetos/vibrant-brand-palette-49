import { useMemo, useState } from "react";
import { useMontado } from "@/lib/use-montado";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, PlayCircle, Quote } from "lucide-react";
import { SITE_URL } from "@/config/conteudo";
import { useConteudoSite, usePublicacaoPublica, usePublicacoesPublicas } from "@/lib/cms/consultas";
import { TIPOS_PUBLICACAO, type TipoPublicacao } from "@/lib/cms/tipos";
import { formatarData, videoIncorporado } from "@/lib/cms/util";
import { AberturaPagina, PaginaInterna, Paragrafos } from "@/components/site/estrutura";
import { BotaoCompartilhar } from "@/components/site/compartilhar";

const DESCRICAO =
  "Testemunhos, histórias de transformação, mensagens de fé, reflexões e vídeos especiais do Mulheres Curadas.";

export const Route = createFileRoute("/mensagens")({
  validateSearch: (busca: Record<string, unknown>): { p?: string } => ({
    p: typeof busca.p === "string" && busca.p ? busca.p : undefined,
  }),
  component: Pagina,
  head: () => ({
    meta: [
      { title: "Mensagens e testemunhos — Mulheres Curadas" },
      { name: "description", content: DESCRICAO },
      { property: "og:title", content: "Mensagens e testemunhos — Mulheres Curadas" },
      { property: "og:description", content: DESCRICAO },
      { property: "og:url", content: `${SITE_URL}/mensagens/` },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/mensagens/` }],
  }),
});

function Pagina() {
  const busca = Route.useSearch();
  const montado = useMontado();
  const p = montado ? busca.p : undefined;
  return <PaginaInterna>{p ? <Publicacao slug={p} /> : <Lista />}</PaginaInterna>;
}

function Lista() {
  const { data, isLoading } = usePublicacoesPublicas();
  const { data: conteudo } = useConteudoSite();
  const [tipo, setTipo] = useState<TipoPublicacao | "todos">("todos");
  const tipos = useMemo(() => [...new Set((data ?? []).map((p) => p.tipo))], [data]);
  const lista = (data ?? []).filter((p) => tipo === "todos" || p.tipo === tipo);
  const mensagem = conteudo?.inicio.mensagem_idealizadora.trim();

  return (
    <>
      <AberturaPagina
        selo="Mensagens e testemunhos"
        titulo="Histórias de"
        enfase="transformação."
        texto={DESCRICAO}
      />

      {mensagem && (
        <section className="mx-auto mb-16 max-w-3xl px-6 text-center">
          <Quote className="mx-auto h-8 w-8 text-[color:var(--rose-deep)]/50" aria-hidden="true" />
          <blockquote className="mt-4 text-display text-2xl italic leading-relaxed text-primary md:text-3xl">
            <Paragrafos texto={mensagem} className="mt-3 first:mt-0" />
          </blockquote>
          <p className="eyebrow mt-6 text-primary/70">
            — {conteudo?.sobre.idealizadora_nome},{" "}
            {conteudo?.sobre.idealizadora_titulo?.toLowerCase()}
          </p>
        </section>
      )}

      <section className="mx-auto max-w-7xl px-6 md:px-12">
        {tipos.length > 1 && (
          <div className="mb-10 flex flex-wrap justify-center gap-2">
            {(["todos", ...tipos] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTipo(t)}
                aria-pressed={tipo === t}
                className={`min-h-[44px] rounded-full px-5 text-xs uppercase tracking-[0.2em] transition ${tipo === t ? "bg-primary text-primary-foreground" : "text-primary ring-1 ring-primary/20 hover:ring-primary/50"}`}
              >
                {t === "todos" ? "Todos" : TIPOS_PUBLICACAO[t].plural}
              </button>
            ))}
          </div>
        )}
        {isLoading ? (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-72 animate-pulse rounded-3xl bg-[color:color-mix(in_oklch,var(--rose-soft)_15%,var(--cream))]"
              />
            ))}
          </div>
        ) : !lista.length ? (
          <p className="text-center text-lg italic text-foreground/60">
            Em breve, a história de mais uma mulher curada.
          </p>
        ) : (
          <ul className="flex flex-wrap justify-center gap-8">
            {lista.map((p, i) => (
              <li
                key={p.id}
                className="animate-in fade-in slide-in-from-bottom-4 duration-700"
                style={{ animationDelay: `${i * 60}ms`, animationFillMode: "both" }}
              >
                <Link
                  to="/mensagens"
                  search={{ p: p.slug }}
                  className="group flex h-full flex-col overflow-hidden rounded-3xl bg-card shadow-sm ring-1 ring-primary/5 transition hover:-translate-y-1 hover:shadow-md"
                >
                  {p.imagem_url ? (
                    <div className="relative aspect-[16/10] overflow-hidden">
                      <img
                        src={p.imagem_url}
                        alt=""
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      {p.video_url && (
                        <PlayCircle
                          className="absolute inset-0 m-auto h-14 w-14 text-white drop-shadow-lg"
                          aria-hidden="true"
                        />
                      )}
                    </div>
                  ) : (
                    <div className="px-8 pt-8">
                      {p.video_url ? (
                        <PlayCircle
                          className="h-8 w-8 text-[color:var(--rose-deep)]/60"
                          aria-hidden="true"
                        />
                      ) : (
                        <Quote
                          className="h-8 w-8 text-[color:var(--rose-deep)]/40"
                          aria-hidden="true"
                        />
                      )}
                    </div>
                  )}
                  <div className="flex flex-1 flex-col p-8">
                    <p className="eyebrow text-[0.6rem] text-primary/60">
                      {TIPOS_PUBLICACAO[p.tipo].rotulo}
                    </p>
                    <h2 className="mt-3 text-display text-3xl leading-tight text-primary">
                      {p.titulo}
                    </h2>
                    {(p.resumo || p.conteudo) && (
                      <p className="mt-4 line-clamp-4 flex-1 leading-relaxed text-foreground/70">
                        {p.resumo || p.conteudo}
                      </p>
                    )}
                    {p.autora && <p className="mt-6 text-sm text-foreground/60">— {p.autora}</p>}
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

function Publicacao({ slug }: { slug: string }) {
  const { data: p, isLoading } = usePublicacaoPublica(slug);

  if (isLoading)
    return (
      <div
        className="mx-auto mt-24 h-96 max-w-3xl animate-pulse rounded-3xl bg-muted"
        aria-hidden="true"
      />
    );
  if (!p) {
    return (
      <div className="px-6 py-24 text-center">
        <p className="text-display text-3xl text-primary">Publicação não encontrada.</p>
        <Link
          to="/mensagens"
          className="mt-6 inline-flex min-h-[44px] items-center gap-2 text-xs uppercase tracking-[0.25em] text-primary"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Todas as mensagens
        </Link>
      </div>
    );
  }
  const video = videoIncorporado(p.video_url);

  return (
    <article className="mx-auto max-w-3xl px-6 pt-10">
      <Link
        to="/mensagens"
        className="inline-flex min-h-[44px] items-center gap-2 text-xs uppercase tracking-[0.25em] text-primary/80 hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Mensagens
      </Link>
      <header className="mt-8 text-center">
        <p className="eyebrow text-primary/70">
          {TIPOS_PUBLICACAO[p.tipo].rotulo} · {formatarData(p.publicado_em)}
        </p>
        <h1 className="mt-5 text-display text-5xl leading-[1.05] text-primary md:text-6xl">
          {p.titulo}
        </h1>
        {p.autora && (
          <p className="mt-5 text-foreground/65">
            {p.autora}
            {p.contexto && ` · ${p.contexto}`}
          </p>
        )}
      </header>
      {video ? (
        <div className="mt-10 aspect-video overflow-hidden rounded-3xl bg-black shadow-lg">
          <iframe
            src={video}
            title={p.titulo}
            className="h-full w-full"
            allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            loading="lazy"
          />
        </div>
      ) : (
        p.imagem_url && <img src={p.imagem_url} alt="" className="mt-10 w-full rounded-3xl" />
      )}
      <div className="mt-10 space-y-6 text-lg leading-[1.85] text-foreground/80">
        <Paragrafos texto={p.conteudo} />
      </div>
      <div className="mt-12 flex justify-center border-t border-primary/10 pt-10">
        <BotaoCompartilhar titulo={`${p.titulo} — Mulheres Curadas`} />
      </div>
    </article>
  );
}
