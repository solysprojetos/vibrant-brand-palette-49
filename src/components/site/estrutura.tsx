import { useState, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Instagram, Mail, MapPin, MessageCircle } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { assetUrl } from "@/lib/asset-url";
import { INSCRICOES_ABERTAS } from "@/config/conteudo";
import { useConteudoSite } from "@/lib/cms/consultas";
import { linkWhatsapp } from "@/lib/cms/util";
import logoWordmark from "@/assets/logo-wordmark-v2.asset.json";
import logoMonogram from "@/assets/logo-monogram-v2.asset.json";

/**
 * Cabecalho e rodape das paginas internas (Sobre, Eventos, Galeria,
 * Mensagens, Contato). A pagina inicial continua com o desenho dela.
 */
export const PAGINAS = [
  { para: "/sobre", rotulo: "Sobre" },
  { para: "/eventos", rotulo: "Eventos" },
  { para: "/galeria", rotulo: "Galeria" },
  { para: "/mensagens", rotulo: "Mensagens" },
  { para: "/contato", rotulo: "Contato" },
] as const;

function Logo({ compacto = false }: { compacto?: boolean }) {
  return (
    <span className="flex items-center gap-3">
      <img
        src={assetUrl(logoMonogram.url)}
        alt=""
        aria-hidden="true"
        width={349}
        height={522}
        className={compacto ? "h-10 w-auto" : "h-11 w-auto md:h-12"}
      />
      <span className="h-8 w-px bg-primary/15" aria-hidden="true" />
      <img
        src={assetUrl(logoWordmark.url)}
        alt="Mulheres Curadas"
        width={746}
        height={266}
        className={compacto ? "h-7 w-auto" : "h-7 w-auto md:h-9"}
      />
    </span>
  );
}

export function CabecalhoSite() {
  const [aberto, setAberto] = useState(false);
  const caminho = useRouterState({ select: (s) => s.location.pathname });

  return (
    <header className="sticky top-0 z-30 border-b border-primary/10 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4 md:px-12">
        <Link to="/" aria-label="Mulheres Curadas, página inicial">
          <Logo />
        </Link>
        <nav
          aria-label="Menu principal"
          className="hidden items-center gap-7 text-[0.68rem] uppercase tracking-[0.2em] text-foreground/70 lg:flex"
        >
          {PAGINAS.map((p) => {
            const ativo = caminho.replace(/\/$/, "").endsWith(p.para);
            return (
              <Link
                key={p.para}
                to={p.para}
                aria-current={ativo ? "page" : undefined}
                className={`relative py-2 transition-colors hover:text-primary ${ativo ? "text-primary after:absolute after:inset-x-0 after:-bottom-0.5 after:h-px after:bg-primary" : ""}`}
              >
                {p.rotulo}
              </Link>
            );
          })}
          {INSCRICOES_ABERTAS && (
            <Link
              to="/inscricao"
              className="rounded-full border border-primary/30 px-5 py-2 text-primary transition-all hover:bg-primary hover:text-primary-foreground"
            >
              Inscreva-se
            </Link>
          )}
        </nav>
        <button
          type="button"
          aria-label={aberto ? "Fechar menu" : "Abrir menu"}
          aria-expanded={aberto}
          aria-controls="menu-paginas"
          onClick={() => setAberto((v) => !v)}
          className="-mr-3 flex h-11 w-11 items-center justify-center text-primary lg:hidden"
        >
          <span className="relative block h-4 w-6" aria-hidden="true">
            <span
              className={`absolute left-0 block h-px w-6 bg-current transition-transform duration-300 ${aberto ? "top-2 rotate-45" : "top-0"}`}
            />
            <span
              className={`absolute top-2 left-0 block h-px w-6 bg-current transition-opacity duration-200 ${aberto ? "opacity-0" : ""}`}
            />
            <span
              className={`absolute left-0 block h-px w-6 bg-current transition-transform duration-300 ${aberto ? "top-2 -rotate-45" : "top-4"}`}
            />
          </span>
        </button>
      </div>
      {aberto && (
        <nav
          id="menu-paginas"
          aria-label="Menu principal"
          className="border-t border-primary/10 bg-background lg:hidden"
        >
          <div className="flex flex-col px-6 py-2">
            <Link
              to="/"
              onClick={() => setAberto(false)}
              className="flex min-h-[44px] items-center text-xs uppercase tracking-[0.3em] text-foreground/70"
            >
              Início
            </Link>
            {PAGINAS.map((p) => (
              <Link
                key={p.para}
                to={p.para}
                onClick={() => setAberto(false)}
                className="flex min-h-[44px] items-center text-xs uppercase tracking-[0.3em] text-foreground/70 hover:text-primary"
              >
                {p.rotulo}
              </Link>
            ))}
            {INSCRICOES_ABERTAS && (
              <Link
                to="/inscricao"
                onClick={() => setAberto(false)}
                className="my-3 flex min-h-[44px] items-center justify-center rounded-full bg-primary text-xs uppercase tracking-[0.25em] text-primary-foreground"
              >
                Inscreva-se
              </Link>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}

export function RodapeSite() {
  const { data } = useConteudoSite();
  const contato = data!.contato;
  const whatsapp = linkWhatsapp(contato.whatsapp);

  return (
    <footer className="mt-24 border-t border-primary/10 bg-[color:color-mix(in_oklch,var(--rose-soft)_8%,var(--cream))]">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-14 md:grid-cols-3 md:px-12">
        <div>
          <Logo compacto />
          <p className="mt-5 max-w-xs text-sm leading-relaxed text-foreground/65">
            Mais do que um encontro: um movimento de mulheres, fé, transformação, acolhimento e
            propósito.
          </p>
          <p className="eyebrow mt-5 text-primary/70">Curadas para curar · MC</p>
        </div>
        <nav aria-label="Páginas" className="grid grid-cols-2 gap-x-6 text-sm">
          <Link
            to="/"
            className="flex min-h-[40px] items-center text-foreground/70 hover:text-primary"
          >
            Início
          </Link>
          {PAGINAS.map((p) => (
            <Link
              key={p.para}
              to={p.para}
              className="flex min-h-[40px] items-center text-foreground/70 hover:text-primary"
            >
              {p.rotulo}
            </Link>
          ))}
          <Link
            to="/politica-de-privacidade"
            className="flex min-h-[40px] items-center text-foreground/70 hover:text-primary"
          >
            Privacidade
          </Link>
        </nav>
        <div className="space-y-2 text-sm">
          {contato.email && (
            <a
              href={`mailto:${contato.email}`}
              className="flex min-h-[40px] items-center gap-3 text-primary hover:underline"
            >
              <Mail className="h-4 w-4" aria-hidden="true" /> {contato.email}
            </a>
          )}
          {contato.instagram && (
            <a
              href={contato.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-[40px] items-center gap-3 text-primary hover:underline"
            >
              <Instagram className="h-4 w-4" aria-hidden="true" /> Instagram
            </a>
          )}
          {whatsapp && (
            <a
              href={whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-[40px] items-center gap-3 text-primary hover:underline"
            >
              <MessageCircle className="h-4 w-4" aria-hidden="true" />{" "}
              {contato.whatsapp_texto || "WhatsApp"}
            </a>
          )}
          {contato.endereco && (
            <p className="flex items-start gap-3 pt-2 text-foreground/60">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary/60" aria-hidden="true" />{" "}
              {contato.endereco}
            </p>
          )}
        </div>
      </div>
      <p className="border-t border-primary/10 py-6 text-center text-xs text-foreground/55">
        © {new Date().getFullYear()} Mulheres Curadas
      </p>
    </footer>
  );
}

export function PaginaInterna({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:absolute focus:left-6 focus:top-6 focus:z-50 focus:rounded-full focus:bg-primary focus:px-6 focus:py-3 focus:text-xs focus:uppercase focus:tracking-[0.25em] focus:text-primary-foreground"
      >
        Pular para o conteúdo
      </a>
      <CabecalhoSite />
      <main id="conteudo">{children}</main>
      <RodapeSite />
      <Toaster position="top-center" />
    </div>
  );
}

/** Abertura das paginas internas: selo, titulo grande e uma linha de apoio. */
export function AberturaPagina({
  selo,
  titulo,
  enfase,
  texto,
}: {
  selo: string;
  titulo: string;
  enfase?: string;
  texto?: string;
}) {
  return (
    <section className="relative overflow-hidden pt-16 pb-12 md:pt-24 md:pb-16">
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse at 80% 0%, color-mix(in oklch, var(--rose-soft) 35%, transparent) 0%, transparent 60%), linear-gradient(180deg, var(--cream), color-mix(in oklch, var(--rose-soft) 10%, var(--cream)))",
        }}
      />
      <div className="mx-auto max-w-4xl px-6 text-center md:px-12">
        <p className="eyebrow text-primary/80 animate-in fade-in duration-700">{selo}</p>
        <h1 className="mt-6 text-display text-5xl leading-[1.05] text-primary animate-in fade-in slide-in-from-bottom-3 duration-700 md:text-7xl">
          {titulo} {enfase && <span className="italic">{enfase}</span>}
        </h1>
        {texto && (
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-foreground/70 animate-in fade-in duration-1000">
            {texto}
          </p>
        )}
      </div>
    </section>
  );
}

/** Texto com paragrafos separados por linha em branco. */
export function Paragrafos({ texto, className = "" }: { texto: string; className?: string }) {
  return (
    <>
      {texto
        .split(/\n{2,}/)
        .map((p) => p.trim())
        .filter(Boolean)
        .map((p, i) => (
          <p key={i} className={`whitespace-pre-line ${className}`}>
            {p}
          </p>
        ))}
    </>
  );
}
