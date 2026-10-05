import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { assetUrl } from "@/lib/asset-url";
import { FormularioInscricao } from "@/components/formulario-inscricao";
import { PassosInscricao } from "@/components/passos-inscricao";
import { INSCRICOES_ABERTAS, SITE_URL, contato, proximoEncontro } from "@/config/conteudo";
import logoWordmark from "@/assets/logo-wordmark-v2.asset.json";
import logoMonogram from "@/assets/logo-monogram-v2.asset.json";

/**
 * Pagina propria de inscricao.
 *
 * Existe para haver um endereco curto para mandar no WhatsApp e no Instagram
 * — /inscricao — levando direto ao formulario, sem a visitante percorrer a
 * pagina inteira antes. O formulario e o mesmo componente da home, entao os
 * campos e a validacao nunca ficam diferentes entre os dois lugares.
 *
 * Enquanto INSCRICOES_ABERTAS (src/config/conteudo.ts) for false, a pagina
 * continua no ar — o endereco pode ja ter sido compartilhado — mas mostra um
 * aviso de "em breve" no lugar do formulario.
 */

const DESCRICAO =
  "Faça sua inscrição para os encontros Mulheres Curadas: preencha seus dados e reserve seu lugar.";

export const Route = createFileRoute("/inscricao")({
  component: Inscricao,
  head: () => ({
    meta: [
      { title: "Inscrição — Mulheres Curadas" },
      { name: "description", content: DESCRICAO },
      { name: "robots", content: INSCRICOES_ABERTAS ? "index, follow" : "noindex, follow" },
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
            to="/"
            className="inline-flex min-h-[44px] items-center gap-2 text-xs uppercase tracking-[0.2em] text-primary/80 transition-colors hover:text-primary"
          >
            <ArrowLeft aria-hidden="true" className="h-4 w-4" />
            <span className="hidden sm:inline">Voltar</span>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-14 md:px-12 md:py-20">
        <div className="text-center lg:text-left">
          {INSCRICOES_ABERTAS && (
            <p className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-xs uppercase tracking-[0.2em] text-primary">
              <span aria-hidden="true" className="h-2 w-2 rounded-full bg-primary" />
              Inscrições abertas
            </p>
          )}
          <h1 className="mt-6 text-display text-4xl leading-tight text-primary md:text-5xl">
            Reserve seu <span className="italic">lugar.</span>
          </h1>
        </div>

        <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-start">
          {/* Coluna do resumo: o encontro (quando houver dados) e o passo a
            passo. No celular vem antes do formulario. */}
          <aside className="order-2 space-y-6 lg:order-1">
            {/* So aparece quando a data estiver cadastrada em src/config/conteudo.ts. */}
            {proximoEncontro.data && (
              <div className="rounded-2xl bg-primary p-6 text-primary-foreground">
                <p className="eyebrow text-[0.6rem] opacity-70">Próximo encontro</p>
                <p className="mt-2 text-display text-2xl italic leading-snug">
                  {proximoEncontro.data}
                </p>
                {proximoEncontro.horario && (
                  <p className="mt-1 text-sm opacity-80">{proximoEncontro.horario}</p>
                )}
                {proximoEncontro.local && (
                  <p className="mt-1 text-sm opacity-80">{proximoEncontro.local}</p>
                )}
              </div>
            )}
            <div>
              <h2 className="eyebrow text-primary/80">Como funciona</h2>
              <div className="mt-4">
                <PassosInscricao claro />
              </div>
            </div>
          </aside>

          <div className="order-1 rounded-[2rem] border border-primary/10 bg-card p-6 shadow-sm md:p-10 lg:order-2">
            {INSCRICOES_ABERTAS ? (
              <>
                <h2 className="text-display text-3xl text-primary">Seus dados</h2>
                <p className="mt-2 text-sm text-foreground/70">
                  Preencha abaixo para receber seu ingresso.
                </p>
                <FormularioInscricao />
              </>
            ) : (
              <div className="text-center">
                <p className="eyebrow text-primary/80">Inscrições em breve</p>
                <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-foreground/70">
                  As inscrições para o próximo encontro ainda não estão abertas. Assim que forem
                  liberadas, o formulário aparece aqui.
                </p>
              </div>
            )}
          </div>
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
