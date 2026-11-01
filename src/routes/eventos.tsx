import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { assetUrl } from "@/lib/asset-url";
import { Evento } from "@/components/evento";
import { SITE_URL, proximoEncontro } from "@/config/conteudo";
import logoWordmark from "@/assets/logo-wordmark-v2.asset.json";
import logoMonogram from "@/assets/logo-monogram-v2.asset.json";

/**
 * Pagina de eventos: o mesmo bloco da pagina inicial, com endereco proprio
 * (/eventos) para mandar no WhatsApp e no Instagram.
 */

const DESCRICAO = `Encontro Mulheres Curadas: 9 de novembro, às 18h30, na ${proximoEncontro.local}. Garanta sua vaga.`;

export const Route = createFileRoute("/eventos")({
  component: PaginaEvento,
  head: () => ({
    meta: [
      { title: "Eventos — Mulheres Curadas" },
      { name: "description", content: DESCRICAO },
      { property: "og:title", content: "Eventos — Mulheres Curadas" },
      { property: "og:description", content: DESCRICAO },
      { property: "og:image", content: `${SITE_URL}/imagens/banner-encontro-9-nov.jpg` },
      { property: "og:url", content: `${SITE_URL}/eventos/` },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/eventos/` }],
  }),
});

function PaginaEvento() {
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

      <main className="mx-auto max-w-6xl px-4 py-10 md:px-6 md:py-16">
        <Evento />
      </main>
    </div>
  );
}
