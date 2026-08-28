import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { assetUrl } from "@/lib/asset-url";
import { FormularioInscricao } from "@/components/formulario-inscricao";
import { SITE_URL, contato, proximoEncontro } from "@/config/conteudo";
import logoWordmark from "@/assets/logo-wordmark-v2.asset.json";
import logoMonogram from "@/assets/logo-monogram-v2.asset.json";

/**
 * Pagina propria de inscricao.
 *
 * Existe para haver um endereco curto para mandar no WhatsApp e no Instagram
 * — /inscricao — levando direto ao formulario, sem a visitante percorrer a
 * pagina inteira antes. O formulario e o mesmo componente da home, entao os
 * campos e a validacao nunca ficam diferentes entre os dois lugares.
 */

const DESCRICAO =
  "Faça sua inscrição para os encontros Mulheres Curadas: preencha seus dados e reserve seu lugar.";

export const Route = createFileRoute("/inscricao")({
  component: Inscricao,
  head: () => ({
    meta: [
      { title: "Inscrição — Mulheres Curadas" },
      { name: "description", content: DESCRICAO },
      { name: "robots", content: "index, follow" },
      { property: "og:title", content: "Inscrição — Mulheres Curadas" },
      { property: "og:description", content: DESCRICAO },
      { property: "og:url", content: `${SITE_URL}/inscricao/` },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/inscricao/` }],
  }),
});

function Inscricao() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-primary/10">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-6 md:px-12">
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
            to="/"
            className="inline-flex min-h-[44px] items-center gap-2 text-xs uppercase tracking-[0.2em] text-primary/80 transition-colors hover:text-primary"
          >
            <ArrowLeft aria-hidden="true" className="h-4 w-4" />
            <span className="hidden sm:inline">Voltar</span>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-6 py-14 md:px-12 md:py-20">
        <div className="text-center">
          <p className="eyebrow text-primary/80">Inscrição</p>
          <h1 className="mt-4 text-display text-4xl leading-tight text-primary md:text-5xl">
            Reserve seu <span className="italic">lugar.</span>
          </h1>
          {/* So aparece quando a data estiver cadastrada em src/config/conteudo.ts. */}
          {proximoEncontro.data && (
            <div className="mt-8 inline-flex flex-col items-center gap-1 rounded-[2rem] bg-[color:var(--rose-soft)]/30 px-10 py-5">
              <span className="eyebrow text-primary/70">Próximo encontro</span>
              <span className="text-display text-2xl leading-snug text-primary italic md:text-3xl">
                {proximoEncontro.data}
              </span>
              {proximoEncontro.local && (
                <span className="text-sm text-primary/80">{proximoEncontro.local}</span>
              )}
            </div>
          )}
        </div>

        <div className="mt-10 rounded-[2rem] border border-primary/10 bg-primary-foreground/60 p-6 shadow-sm md:p-10">
          <FormularioInscricao />
        </div>

        <p className="mt-10 text-center text-sm leading-relaxed text-foreground/60">
          Ficou com alguma dúvida? Escreva para{" "}
          <a
            href={`mailto:${contato.email}`}
            className="text-primary underline underline-offset-4 transition-opacity hover:opacity-80"
          >
            {contato.email}
          </a>
          .
        </p>
      </main>
    </div>
  );
}
