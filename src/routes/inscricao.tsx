import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { assetUrl } from "@/lib/asset-url";
import { FormularioInscricao } from "@/components/formulario-inscricao";
import {
  INSCRICOES_ABERTAS,
  LIMITE_INSCRICOES,
  SITE_URL,
  contato,
  proximoEncontro,
} from "@/config/conteudo";
import { useVagas } from "@/lib/vagas";
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
  const vagas = useVagas();
  const esgotado = vagas.restantes === 0;

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

      <main className="mx-auto max-w-2xl px-6 py-10 md:px-12 md:py-16">
        <div className="text-center">
          <h1 className="text-display text-4xl leading-tight text-primary md:text-5xl">
            Reserve seu <span className="italic">lugar.</span>
          </h1>
          <div className="mx-auto mt-5 max-w-sm space-y-1 text-left text-[15px] leading-relaxed text-foreground/85 lg:mx-0 lg:max-w-none">
            {proximoEncontro.data && (
              <>
                <p>
                  <strong className="font-semibold text-foreground">Data:</strong>{" "}
                  {proximoEncontro.data}, {proximoEncontro.horario}
                </p>
              </>
            )}
            {proximoEncontro.local && (
              <>
                <p>
                  <strong className="font-semibold text-foreground">Local:</strong>{" "}
                  {proximoEncontro.local}
                </p>
                <p>
                  <strong className="font-semibold text-foreground">Endereço:</strong>{" "}
                  {proximoEncontro.endereco}
                </p>
              </>
            )}
            {INSCRICOES_ABERTAS && (
              <>
                <p>
                  <strong className="font-semibold text-foreground">Vagas:</strong>{" "}
                  {esgotado
                    ? "Esgotadas"
                    : vagas.restantes === null
                      ? `${vagas.limite ?? LIMITE_INSCRICOES}`
                      : `Restam ${vagas.restantes} de ${vagas.limite ?? LIMITE_INSCRICOES}`}
                </p>
              </>
            )}
          </div>
        </div>

        {/* O passo a passo e o aviso do alimento ficam so na pagina inicial:
          quem chega aqui ja leu. */}
        <div className="mx-auto mt-8 max-w-2xl">
          <div className="rounded-[2rem] border border-primary/10 bg-card p-6 shadow-sm md:p-10">
            {INSCRICOES_ABERTAS && esgotado ? (
              <div className="text-center">
                <p className="eyebrow text-primary/80">Vagas esgotadas</p>
                <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-foreground/70">
                  As {vagas.limite ?? LIMITE_INSCRICOES} vagas deste encontro já foram preenchidas.
                  Obrigada pelo carinho — fique de olho nas próximas datas!
                </p>
              </div>
            ) : INSCRICOES_ABERTAS ? (
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
