import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { assetUrl } from "@/lib/asset-url";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { SITE_URL } from "@/config/conteudo";
import { reportLovableError } from "../lib/lovable-error-reporting";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Página não encontrada</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          A página que você procura não existe ou mudou de endereço.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Voltar ao início
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Esta página não carregou
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Algo deu errado do nosso lado. Tente atualizar a página ou voltar ao início.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Tentar de novo
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Voltar ao início
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Mulheres Curadas — Curadas para curar" },
      {
        name: "description",
        content:
          "Um convite para viver a transformação, florescer em Cristo e refletir Sua graça. Cura, propósito e transformação para mulheres de fé.",
      },
      { name: "author", content: "Mulheres Curadas" },
      { name: "theme-color", content: "#FBF7F2" },
      { property: "og:site_name", content: "Mulheres Curadas" },
      { property: "og:locale", content: "pt_BR" },
      { property: "og:title", content: "Mulheres Curadas — Curadas para curar" },
      {
        property: "og:description",
        content: "Cura, propósito e transformação para mulheres de fé.",
      },
      { property: "og:type", content: "website" },
      // A previa do WhatsApp, do Facebook e do Instagram le esta imagem.
      // O endereco precisa ser absoluto — caminho relativo nao e aceito.
      { property: "og:image", content: `${SITE_URL}/imagens/og-capa.jpg` },
      { property: "og:image:secure_url", content: `${SITE_URL}/imagens/og-capa.jpg` },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:image:type", content: "image/jpeg" },
      {
        property: "og:image:alt",
        content: "Mulheres reunidas em oração durante um encontro Mulheres Curadas",
      },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Mulheres Curadas — Curadas para curar" },
      {
        name: "twitter:description",
        content: "Cura, propósito e transformação para mulheres de fé.",
      },
      { name: "twitter:image", content: `${SITE_URL}/imagens/og-capa.jpg` },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: assetUrl("/favicon.png"), type: "image/png" },
      { rel: "apple-touch-icon", href: assetUrl("/favicon.png") },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,400&family=Nunito+Sans:wght@300;400;600&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <Outlet />
    </QueryClientProvider>
  );
}
