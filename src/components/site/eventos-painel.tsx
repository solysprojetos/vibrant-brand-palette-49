import { Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  ExternalLink,
  MapPin,
  MessageCircle,
  Ticket,
} from "lucide-react";
import { SITE_URL } from "@/config/conteudo";
import { useEventoPublico, useEventosPublicos } from "@/lib/cms/consultas";
import type { Evento } from "@/lib/cms/tipos";
import {
  ROTULO_SITUACAO,
  formatarData,
  formatarHora,
  linkWhatsapp,
  situacaoDoEvento,
  type SituacaoEvento,
} from "@/lib/cms/util";
import { Paragrafos } from "./estrutura";
import { BotaoCompartilhar } from "./compartilhar";

/**
 * Eventos cadastrados no painel /admin, separados em proximos, em andamento
 * e realizados. Se o banco estiver vazio (ou fora do ar), nada aparece e a
 * pagina /eventos continua exatamente como era.
 */
export function EventosDoPainel() {
  const { data } = useEventosPublicos();
  if (!data?.length) return null;

  const grupos: Record<SituacaoEvento, Evento[]> = { andamento: [], proximo: [], realizado: [] };
  for (const e of data) grupos[situacaoDoEvento(e)].push(e);
  grupos.realizado.reverse();

  const secoes: { chave: SituacaoEvento; titulo: string; enfase: string }[] = [
    { chave: "andamento", titulo: "Acontecendo", enfase: "agora." },
    { chave: "proximo", titulo: "Próximos", enfase: "encontros." },
    { chave: "realizado", titulo: "Encontros", enfase: "realizados." },
  ];

  return (
    <div className="mt-20 space-y-20 md:mt-28">
      {secoes
        .filter((s) => grupos[s.chave].length)
        .map((s) => (
          <section key={s.chave} aria-labelledby={`eventos-${s.chave}`}>
            <h2
              id={`eventos-${s.chave}`}
              className="text-center text-display text-4xl text-primary md:text-5xl"
            >
              {s.titulo} <span className="italic">{s.enfase}</span>
            </h2>
            <ul className="mt-10 flex flex-wrap justify-center gap-8">
              {grupos[s.chave].map((e) => (
                <li
                  key={e.id}
                  className="w-full sm:w-[calc(50%-1rem)] lg:w-[calc(33.333%-1.34rem)]"
                >
                  <CartaoEvento evento={e} situacao={s.chave} />
                </li>
              ))}
            </ul>
          </section>
        ))}
    </div>
  );
}

function CartaoEvento({ evento: e, situacao }: { evento: Evento; situacao: SituacaoEvento }) {
  const d = new Date(e.inicio);
  return (
    <Link
      to="/eventos"
      search={{ e: e.slug }}
      className={`group flex h-full flex-col overflow-hidden rounded-3xl bg-card shadow-sm ring-1 ring-primary/5 transition hover:-translate-y-1 hover:shadow-md ${situacao === "realizado" ? "opacity-90" : ""}`}
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-muted">
        {e.banner_url && (
          <img
            src={e.banner_url}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        )}
        <span className="absolute top-4 left-4 flex h-16 w-16 flex-col items-center justify-center rounded-2xl bg-background/95 text-primary shadow">
          <span className="text-display text-2xl leading-none">
            {d.toLocaleDateString("pt-BR", { day: "2-digit", timeZone: "America/Fortaleza" })}
          </span>
          <span className="text-[0.6rem] uppercase tracking-[0.2em]">
            {d
              .toLocaleDateString("pt-BR", { month: "short", timeZone: "America/Fortaleza" })
              .replace(".", "")}
          </span>
        </span>
        {situacao !== "proximo" && (
          <span className="absolute top-4 right-4 rounded-full bg-background/95 px-3 py-1 text-[0.6rem] uppercase tracking-[0.2em] text-primary">
            {ROTULO_SITUACAO[situacao]}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-7">
        <h3 className="text-display text-3xl leading-tight text-primary">{e.titulo}</h3>
        <p className="mt-3 text-sm text-foreground/65">
          {formatarData(e.inicio)}, {formatarHora(e.inicio)}
          {e.local && ` · ${e.local}`}
        </p>
        {e.resumo && (
          <p className="mt-4 line-clamp-3 leading-relaxed text-foreground/70">{e.resumo}</p>
        )}
        <span className="eyebrow mt-auto pt-6 text-[0.62rem] text-primary">Ver detalhes →</span>
      </div>
    </Link>
  );
}

export function DetalheEvento({ slug }: { slug: string }) {
  const { data: e, isLoading } = useEventoPublico(slug);

  if (isLoading)
    return (
      <div
        className="mx-auto h-[60vh] max-w-5xl animate-pulse rounded-3xl bg-muted"
        aria-hidden="true"
      />
    );
  if (!e) {
    return (
      <div className="py-20 text-center">
        <p className="text-display text-3xl text-primary">Evento não encontrado.</p>
        <Link
          to="/eventos"
          className="mt-6 inline-flex min-h-[44px] items-center gap-2 text-xs uppercase tracking-[0.25em] text-primary"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Todos os eventos
        </Link>
      </div>
    );
  }

  const situacao = situacaoDoEvento(e);
  const whatsapp = linkWhatsapp(e.whatsapp, `Olá! Tenho uma dúvida sobre o evento "${e.titulo}".`);
  const mapa =
    e.mapa_url ||
    (e.endereco
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${e.local} ${e.endereco}`)}`
      : "");
  const programacao = Array.isArray(e.programacao) ? e.programacao : [];

  const dados = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: e.titulo,
    startDate: e.inicio,
    ...(e.fim ? { endDate: e.fim } : {}),
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    eventStatus: "https://schema.org/EventScheduled",
    description: e.resumo || e.descricao.slice(0, 300),
    ...(e.banner_url ? { image: e.banner_url } : {}),
    url: `${SITE_URL}/eventos/?e=${e.slug}`,
    organizer: { "@type": "Organization", name: "Mulheres Curadas", url: `${SITE_URL}/` },
    ...(e.local
      ? { location: { "@type": "Place", name: e.local, address: e.endereco || e.local } }
      : {}),
  };

  return (
    <article className="animate-in fade-in duration-500">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(dados) }}
      />
      <Link
        to="/eventos"
        className="inline-flex min-h-[44px] items-center gap-2 text-xs uppercase tracking-[0.25em] text-primary/80 hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Todos os eventos
      </Link>
      <div className="mt-6 grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-14">
        {e.banner_url && (
          <img
            src={e.banner_url}
            alt={`Banner do evento ${e.titulo}`}
            className="mx-auto h-auto w-full max-w-md rounded-3xl shadow-sm ring-1 ring-primary/10 lg:sticky lg:top-28"
          />
        )}
        <div className={e.banner_url ? "" : "lg:col-span-2 mx-auto max-w-3xl"}>
          <p className="eyebrow text-primary/80">{ROTULO_SITUACAO[situacao]}</p>
          <h1 className="mt-4 text-display text-5xl leading-[1.05] text-primary md:text-6xl">
            {e.titulo}
          </h1>

          <ul className="mt-8 space-y-3 text-foreground/80">
            <li className="flex items-start gap-3">
              <CalendarDays
                className="mt-0.5 h-5 w-5 shrink-0 text-primary/70"
                aria-hidden="true"
              />
              <span className="first-letter:uppercase">
                {formatarData(e.inicio, { weekday: "long" })}
              </span>
            </li>
            <li className="flex items-start gap-3">
              <Clock className="mt-0.5 h-5 w-5 shrink-0 text-primary/70" aria-hidden="true" />
              {formatarHora(e.inicio)}
              {e.fim && ` às ${formatarHora(e.fim)}`}
            </li>
            {(e.local || e.endereco) && (
              <li className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-primary/70" aria-hidden="true" />
                <span>
                  {e.local && <strong className="font-semibold text-foreground">{e.local}</strong>}
                  {e.local && e.endereco && <br />}
                  {e.endereco}
                  {mapa && (
                    <a
                      href={mapa}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-2 inline-flex items-center gap-1 text-sm text-primary underline-offset-4 hover:underline"
                    >
                      Ver no mapa <ExternalLink className="h-3 w-3" aria-hidden="true" />
                    </a>
                  )}
                </span>
              </li>
            )}
            {e.investimento && (
              <li className="flex items-start gap-3">
                <Ticket className="mt-0.5 h-5 w-5 shrink-0 text-primary/70" aria-hidden="true" />
                {e.investimento}
              </li>
            )}
          </ul>

          {situacao !== "realizado" && (e.link_inscricao || whatsapp) && (
            <div className="mt-8 flex flex-wrap gap-3">
              {e.link_inscricao && (
                <a
                  href={e.link_inscricao}
                  target={e.link_inscricao.startsWith(SITE_URL) ? undefined : "_blank"}
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[48px] items-center rounded-full bg-primary px-8 text-xs uppercase tracking-[0.25em] text-primary-foreground transition hover:opacity-90"
                >
                  Fazer inscrição
                </a>
              )}
              {whatsapp && (
                <a
                  href={whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[48px] items-center gap-2 rounded-full border border-primary/30 px-6 text-xs uppercase tracking-[0.2em] text-primary transition hover:bg-primary hover:text-primary-foreground"
                >
                  <MessageCircle className="h-4 w-4" aria-hidden="true" /> Dúvidas no WhatsApp
                </a>
              )}
            </div>
          )}

          {e.descricao && (
            <div className="mt-10 space-y-5 text-lg leading-relaxed text-foreground/80">
              <Paragrafos texto={e.descricao} />
            </div>
          )}

          {programacao.length > 0 && (
            <section className="mt-12">
              <h2 className="text-display text-3xl text-primary">Programação</h2>
              <ol className="mt-6 border-l border-primary/15">
                {programacao.map((p, i) => (
                  <li key={i} className="relative pb-6 pl-8 last:pb-0">
                    <span
                      className="absolute top-1.5 -left-[5px] h-2.5 w-2.5 rounded-full bg-[color:var(--rose-deep)]"
                      aria-hidden="true"
                    />
                    <p className="eyebrow text-[0.62rem] text-primary/70">{p.hora}</p>
                    <p className="mt-1 text-lg text-foreground/90">{p.titulo}</p>
                    {p.descricao && <p className="text-sm text-foreground/60">{p.descricao}</p>}
                  </li>
                ))}
              </ol>
            </section>
          )}

          {e.informacoes && (
            <section className="mt-12 rounded-3xl bg-[color:color-mix(in_oklch,var(--rose-soft)_12%,var(--cream))] p-8">
              <h2 className="text-display text-2xl text-primary">Informações adicionais</h2>
              <div className="mt-3 space-y-3 leading-relaxed text-foreground/80">
                <Paragrafos texto={e.informacoes} />
              </div>
            </section>
          )}

          <div className="mt-10">
            <BotaoCompartilhar titulo={`${e.titulo} — Mulheres Curadas`} />
          </div>
        </div>
      </div>
    </article>
  );
}
