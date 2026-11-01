import { createFileRoute, Link } from "@tanstack/react-router";
import { SITE_URL } from "@/config/conteudo";
import { ImagemResponsiva } from "@/components/imagem-responsiva";
import { useConteudoSite, useEquipePublica } from "@/lib/cms/consultas";
import { AberturaPagina, PaginaInterna, Paragrafos } from "@/components/site/estrutura";
import mirror from "@/assets/mirror.asset.json";

const DESCRICAO =
  "A história, a missão, a visão e os valores do Mulheres Curadas, idealizado por Karoline Rodrigues.";

export const Route = createFileRoute("/sobre")({
  component: PaginaSobre,
  head: () => ({
    meta: [
      { title: "Sobre nós — Mulheres Curadas" },
      { name: "description", content: DESCRICAO },
      { property: "og:title", content: "Sobre nós — Mulheres Curadas" },
      { property: "og:description", content: DESCRICAO },
      { property: "og:url", content: `${SITE_URL}/sobre/` },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/sobre/` }],
  }),
});

function PaginaSobre() {
  const { data } = useConteudoSite();
  const { data: equipe } = useEquipePublica();
  const s = data!.sobre;
  const mensagem = data!.inicio.mensagem_idealizadora.trim();
  const [antes, ...resto] = s.titulo.trim().split(" ");

  const pilares = [
    { titulo: "Nossa missão", texto: s.missao },
    { titulo: "Nossa visão", texto: s.visao },
    { titulo: "Nosso propósito", texto: s.proposito },
  ].filter((p) => p.texto.trim());
  const valores = s.valores
    .split("\n")
    .map((v) => v.replace(/^[-•·*]\s*/, "").trim())
    .filter(Boolean);

  return (
    <PaginaInterna>
      <AberturaPagina
        selo="Sobre nós"
        titulo={antes}
        enfase={resto.join(" ")}
        texto={s.introducao}
      />

      {/* Nossa historia */}
      <section className="mx-auto grid max-w-7xl items-center gap-12 px-6 py-12 md:grid-cols-12 md:px-12 md:py-20">
        <div className="md:col-span-5">
          <div className="aspect-[4/5] overflow-hidden rounded-[2rem] shadow-sm">
            {s.imagem ? (
              <img src={s.imagem} alt="" className="h-full w-full object-cover" loading="lazy" />
            ) : (
              <ImagemResponsiva
                src={mirror.url}
                alt="Mulher segurando um espelho de mão, que reflete o seu rosto"
                sizes="(min-width: 768px) 40vw, 100vw"
                className="h-full w-full object-cover"
              />
            )}
          </div>
        </div>
        <div className="md:col-span-6 md:col-start-7">
          <p className="eyebrow text-primary/80">Nossa história</p>
          <div className="mt-6 space-y-6 text-xl leading-relaxed text-foreground/80">
            <Paragrafos texto={s.historia} />
          </div>
        </div>
      </section>

      {/* Missao, visao e proposito */}
      {pilares.length > 0 && (
        <section className="relative py-20 md:py-28">
          <div
            className="absolute inset-0 -z-10"
            style={{
              background:
                "linear-gradient(180deg, transparent, color-mix(in oklch, var(--rose-soft) 22%, var(--cream)), transparent)",
            }}
          />
          <ul
            className={`mx-auto grid max-w-7xl gap-8 px-6 md:px-12 ${pilares.length === 3 ? "md:grid-cols-3" : pilares.length === 2 ? "md:grid-cols-2" : ""}`}
          >
            {pilares.map((p, i) => (
              <li
                key={p.titulo}
                className="rounded-3xl bg-card p-10 shadow-sm ring-1 ring-primary/5"
              >
                <span className="text-display text-6xl italic text-[color:var(--rose-deep)]/40">
                  0{i + 1}
                </span>
                <h2 className="mt-4 text-display text-3xl text-primary">{p.titulo}</h2>
                <div className="mt-4 space-y-4 leading-relaxed text-foreground/70">
                  <Paragrafos texto={p.texto} />
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Valores */}
      {valores.length > 0 && (
        <section className="mx-auto max-w-5xl px-6 py-16 text-center md:px-12">
          <p className="eyebrow text-primary/80">Nossos valores</p>
          <ul className="mt-10 flex flex-wrap justify-center gap-3">
            {valores.map((v) => (
              <li
                key={v}
                className="rounded-full bg-card px-6 py-3 text-display text-xl text-primary shadow-sm ring-1 ring-primary/10"
              >
                {v}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Idealizadora */}
      <section className="mx-auto max-w-7xl px-6 py-16 md:px-12 md:py-24">
        <div className="grid items-center gap-12 overflow-hidden rounded-[2.5rem] bg-card p-8 shadow-sm ring-1 ring-primary/5 md:grid-cols-12 md:p-14">
          {s.idealizadora_foto && (
            <div className="md:col-span-5">
              <img
                src={s.idealizadora_foto}
                alt={s.idealizadora_nome}
                className="aspect-[3/4] w-full rounded-[2rem] object-cover"
                loading="lazy"
              />
            </div>
          )}
          <div className={s.idealizadora_foto ? "md:col-span-7" : "md:col-span-12 text-center"}>
            <p className="eyebrow text-primary/80">{s.idealizadora_titulo}</p>
            <h2 className="mt-4 text-display text-5xl text-primary md:text-6xl">
              {s.idealizadora_nome}
            </h2>
            {s.idealizadora_texto && (
              <div className="mt-6 space-y-4 text-lg leading-relaxed text-foreground/75">
                <Paragrafos texto={s.idealizadora_texto} />
              </div>
            )}
            {mensagem && (
              <blockquote className="mt-8 border-l-2 border-[color:var(--rose-deep)]/40 pl-6 text-left text-display text-2xl italic leading-relaxed text-primary/90">
                <Paragrafos texto={mensagem} className="mt-3 first:mt-0" />
              </blockquote>
            )}
          </div>
        </div>
      </section>

      {/* Equipe */}
      {equipe && equipe.length > 0 && (
        <section className="mx-auto max-w-7xl px-6 py-12 md:px-12">
          <div className="text-center">
            <p className="eyebrow text-primary/80">Equipe</p>
            <h2 className="mt-4 text-display text-5xl text-primary">
              Quem serve <span className="italic">com amor.</span>
            </h2>
          </div>
          <ul className="mt-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {equipe.map((m) => (
              <li key={m.id} className="text-center">
                <div className="mx-auto aspect-square w-44 overflow-hidden rounded-full bg-muted ring-4 ring-card">
                  {m.foto_url ? (
                    <img
                      src={m.foto_url}
                      alt={m.nome}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <span className="flex h-full items-center justify-center text-display text-5xl text-primary/50">
                      {m.nome[0]}
                    </span>
                  )}
                </div>
                <p className="mt-5 text-display text-2xl text-primary">{m.nome}</p>
                {m.cargo && <p className="eyebrow mt-2 text-[0.6rem] text-primary/60">{m.cargo}</p>}
                {m.bio && (
                  <p className="mt-3 text-sm leading-relaxed text-foreground/65">{m.bio}</p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mx-auto max-w-3xl px-6 pt-12 text-center">
        <p className="text-display text-3xl italic text-primary md:text-4xl">
          Quem é curada, também cura.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link
            to="/eventos"
            className="rounded-full bg-primary px-8 py-4 text-xs uppercase tracking-[0.3em] text-primary-foreground transition hover:opacity-90"
          >
            Próximos encontros
          </Link>
          <Link
            to="/contato"
            className="inline-flex min-h-[44px] items-center px-4 text-xs uppercase tracking-[0.3em] text-primary underline-offset-8 hover:underline"
          >
            Fale com a gente
          </Link>
        </div>
      </section>
    </PaginaInterna>
  );
}
