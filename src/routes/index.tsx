import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Instagram, MessageCircle, MapPin } from "lucide-react";
import { assetUrl } from "@/lib/asset-url";
import { ImagemResponsiva } from "@/components/imagem-responsiva";
import { Depoimentos } from "@/components/depoimentos";
import { Duvidas } from "@/components/duvidas";
import { SITE_URL, contato, proximoEncontro } from "@/config/conteudo";
import logoWordmark from "@/assets/logo-wordmark-v2.asset.json";
import logoMonogram from "@/assets/logo-monogram-v2.asset.json";
import flowers from "@/assets/flowers.asset.json";
import mirror from "@/assets/mirror.asset.json";
import momento1 from "@/assets/momento-1.asset.json";
import momento2 from "@/assets/momento-2.asset.json";
import momento3 from "@/assets/momento-3.asset.json";
import momento4 from "@/assets/momento-4.asset.json";
import momento5 from "@/assets/momento-5.asset.json";
import momento6 from "@/assets/momento-6.asset.json";
import momento7 from "@/assets/momento-7.asset.json";
import momento8 from "@/assets/momento-8.asset.json";

// As descricoes acompanham cada foto para que quem usa leitor de tela ouca o
// que esta na imagem, e nao apenas "Momento 3".
const momentos = [
  {
    asset: momento2,
    alt: "Salão do encontro com mulheres de pé, em oração, com as mãos sobre o peito",
  },
  { asset: momento3, alt: "Participante de braços erguidos em adoração diante do palco" },
  { asset: momento4, alt: "Duas participantes em um longo abraço durante o encontro" },
  { asset: momento5, alt: "Participante de mãos unidas em oração" },
  { asset: momento6, alt: "Participantes de pé, cantando juntas no salão do encontro" },
  { asset: momento7, alt: "Participante de olhos fechados, com a mão sobre o coração" },
  { asset: momento8, alt: "Participante em oração, à mesa, durante o encontro" },
];

// Um lugar so para os links do menu: o menu do computador e o do celular leem
// desta lista, entao nunca ficam diferentes um do outro.
const navegacao = [
  ["#sobre", "Sobre"],
  ["#pilares", "Pilares"],
  ["#momentos", "Momentos"],
  ["#depoimentos", "Depoimentos"],
  ["#duvidas", "Dúvidas"],
  ["#contato", "Contato"],
];

const DESCRICAO =
  "Um convite para viver a transformação, florescer em Cristo e refletir Sua graça. Cura, propósito e transformação para mulheres de fé.";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    links: [{ rel: "canonical", href: `${SITE_URL}/` }],
    meta: [{ property: "og:url", content: `${SITE_URL}/` }],
  }),
});

const pillars = [
  {
    title: "Cura",
    text: "Um espaço seguro para curar feridas, silenciar vozes antigas e reencontrar-se aos pés d'Ele.",
  },
  {
    title: "Propósito",
    text: "Descobrir, nomear e caminhar no chamado que Deus escreveu em você antes do princípio.",
  },
  {
    title: "Transformação",
    text: "Florescer em Cristo, refletindo Sua graça em cada relação, escolha e passo.",
  },
];

/**
 * Dados estruturados para o Google e para a previa dos links.
 * O bloco de Evento so entra quando o proximo encontro tiver nome e data
 * cadastrados em src/config/conteudo.ts — sem dado real, nada e publicado.
 */
function dadosEstruturados() {
  const organizacao = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Mulheres Curadas",
    alternateName: "MC — Curadas para curar",
    url: `${SITE_URL}/`,
    logo: `${SITE_URL}/imagens/logo-monogram-cropped.png`,
    image: `${SITE_URL}/imagens/og-capa.jpg`,
    email: contato.email,
    description: DESCRICAO,
    ...(contato.instagram ? { sameAs: [contato.instagram] } : {}),
  };

  const e = proximoEncontro;
  if (!e.nome.trim() || !e.dataISO.trim()) return [organizacao];

  const evento = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: e.nome,
    startDate: e.dataISO,
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    eventStatus: "https://schema.org/EventScheduled",
    url: `${SITE_URL}/inscricao/`,
    image: `${SITE_URL}/imagens/og-capa.jpg`,
    organizer: { "@type": "Organization", name: "Mulheres Curadas", url: `${SITE_URL}/` },
    ...(e.local.trim()
      ? {
          location: {
            "@type": "Place",
            name: e.local,
            ...(e.endereco.trim() ? { address: e.endereco } : {}),
          },
        }
      : {}),
    ...(e.investimento.trim()
      ? {
          offers: {
            "@type": "Offer",
            priceCurrency: "BRL",
            price: /gratuit/i.test(e.investimento)
              ? "0"
              : (e.investimento.match(/[\d.,]+/)?.[0] ?? e.investimento),
            url: `${SITE_URL}/inscricao/`,
            availability: "https://schema.org/InStock",
          },
        }
      : {}),
  };

  return [organizacao, evento];
}

function Index() {
  const [menuAberto, setMenuAberto] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(dadosEstruturados()) }}
      />

      {/* Atalho para quem navega pelo teclado: fica invisivel ate receber foco. */}
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:absolute focus:left-6 focus:top-6 focus:z-50 focus:rounded-full focus:bg-primary focus:px-6 focus:py-3 focus:text-xs focus:uppercase focus:tracking-[0.25em] focus:text-primary-foreground"
      >
        Pular para o conteúdo
      </a>

      {/* Nav */}
      <header className="absolute top-0 right-0 left-0 z-20">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-6 md:px-12 xl:gap-8">
          <a href="#" className="flex items-center gap-3" aria-label="Mulheres Curadas, início">
            <img
              src={assetUrl(logoMonogram.url)}
              alt=""
              aria-hidden="true"
              width={349}
              height={522}
              className="h-11 w-auto md:h-14"
            />
            <span className="h-8 w-px bg-primary/15 md:h-10" aria-hidden="true" />
            <img
              src={assetUrl(logoWordmark.url)}
              alt="Mulheres Curadas"
              width={746}
              height={266}
              className="h-8 w-auto md:h-10"
            />
          </a>

          {/* Sete itens nao cabem lado a lado antes de 1024px sem apertar o
              desenho, entao ate la o menu inteiro vive no botao de celular. */}
          <nav
            aria-label="Menu principal"
            className="hidden gap-4 text-[0.6rem] uppercase tracking-[0.12em] text-foreground/70 lg:flex xl:gap-6 xl:text-[0.68rem] xl:tracking-[0.18em]"
          >
            {navegacao.map(([href, texto]) => (
              <a
                key={href}
                href={href}
                className="whitespace-nowrap transition-colors hover:text-primary"
              >
                {texto}
              </a>
            ))}
          </nav>

          <Link
            to="/inscricao"
            className="hidden rounded-full border border-primary/30 px-3 py-2 text-[0.6rem] whitespace-nowrap uppercase tracking-[0.12em] text-primary transition-all hover:bg-primary hover:text-primary-foreground lg:inline-block xl:px-5 xl:text-[0.68rem] xl:tracking-[0.18em]"
          >
            Inscreva-se
          </Link>

          {/* Menu de celular: no desktop o <nav> acima ja da conta */}
          <button
            type="button"
            aria-label={menuAberto ? "Fechar menu" : "Abrir menu"}
            aria-expanded={menuAberto}
            aria-controls="menu-celular"
            onClick={() => setMenuAberto((v) => !v)}
            className="-mr-3 flex h-11 w-11 items-center justify-center text-primary lg:hidden"
          >
            <span className="relative block h-4 w-6" aria-hidden="true">
              <span
                className={`absolute left-0 block h-px w-6 bg-current transition-transform duration-300 ${menuAberto ? "top-2 rotate-45" : "top-0"}`}
              />
              <span
                className={`absolute top-2 left-0 block h-px w-6 bg-current transition-opacity duration-200 ${menuAberto ? "opacity-0" : "opacity-100"}`}
              />
              <span
                className={`absolute left-0 block h-px w-6 bg-current transition-transform duration-300 ${menuAberto ? "top-2 -rotate-45" : "top-4"}`}
              />
            </span>
          </button>
        </div>

        {menuAberto && (
          <nav
            id="menu-celular"
            aria-label="Menu principal"
            className="border-t border-primary/10 bg-background/95 backdrop-blur lg:hidden"
          >
            <div className="flex flex-col px-6 py-2">
              {navegacao.map(([href, texto]) => (
                <a
                  key={href}
                  href={href}
                  onClick={() => setMenuAberto(false)}
                  className="flex min-h-[44px] items-center text-xs uppercase tracking-[0.3em] text-foreground/70 transition-colors hover:text-primary"
                >
                  {texto}
                </a>
              ))}
              <Link
                to="/inscricao"
                onClick={() => setMenuAberto(false)}
                className="my-3 flex min-h-[44px] items-center justify-center rounded-full bg-primary px-5 text-xs uppercase tracking-[0.25em] text-primary-foreground"
              >
                Inscreva-se
              </Link>
            </div>
          </nav>
        )}
      </header>

      <main id="conteudo">
        {/* Hero */}
        <section className="relative overflow-hidden pt-32 pb-24 md:pt-40 md:pb-32">
          <div
            className="absolute inset-0 -z-10"
            style={{
              background:
                "radial-gradient(ellipse at 70% 30%, color-mix(in oklch, var(--rose-soft) 55%, transparent) 0%, transparent 60%), linear-gradient(180deg, var(--cream), color-mix(in oklch, var(--rose-soft) 20%, var(--cream)))",
            }}
          />
          <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-16 px-6 md:grid-cols-12 md:px-12">
            <div className="md:col-span-7">
              <p className="eyebrow text-primary/80">Cura · Propósito · Transformação</p>
              <h1 className="mt-6">
                <span className="sr-only">Mulheres Curadas</span>
                <img
                  src={assetUrl(logoWordmark.url)}
                  alt=""
                  aria-hidden="true"
                  width={746}
                  height={266}
                  className="w-full max-w-[26rem] md:max-w-[34rem] lg:max-w-[38rem]"
                />
              </h1>
              <p className="mt-8 max-w-xl text-lg leading-relaxed text-foreground/75 md:text-xl">
                Mais do que um nome, um convite. Um espaço delicado para mulheres que encontraram,
                ou ainda buscam, cura, força e propósito em sua caminhada de fé.
              </p>
              <div className="mt-10 flex flex-wrap items-center gap-4">
                <a
                  href="#encontros"
                  className="rounded-full bg-primary px-8 py-4 text-xs uppercase tracking-[0.3em] text-primary-foreground transition-all hover:opacity-90"
                >
                  Próximo encontro
                </a>
                <a
                  href="#sobre"
                  className="inline-flex min-h-[44px] items-center text-xs uppercase tracking-[0.3em] text-primary underline-offset-8 hover:underline"
                >
                  Conheça a história
                </a>
              </div>
            </div>

            <div className="relative md:col-span-5">
              {/* Este wrapper ancora o circulo das flores na foto. Sem ele, o
                "absolute -bottom" mediria a partir do fim da coluna inteira. */}
              <div className="relative">
                {/* A foto e 1000x1500 (2:3). Forcar 3/4 fazia o object-cover cortar
                topo e base. Com a proporcao casada, nada e cortado. No celular
                a moldura fica arredondada para a imagem aparecer inteira; do
                md: para cima volta a elipse do desenho original. */}
                <div className="relative aspect-[2/3] overflow-hidden rounded-[2rem] md:rounded-full">
                  <ImagemResponsiva
                    src={mirror.url}
                    alt="Mulher segurando um espelho de mão, que reflete o seu rosto"
                    prioridade
                    sizes="(min-width: 1280px) 480px, (min-width: 768px) 40vw, 100vw"
                    className="h-full w-full object-cover"
                  />
                </div>
                {/* Vinha hidden md:block, entao no celular esta foto nunca aparecia.
                Agora aparece tambem, menor e com recuo mais curto, para nao
                empurrar a pagina para fora da largura da tela. */}
                <div className="absolute -bottom-6 -left-4 aspect-square w-28 overflow-hidden rounded-full border-4 border-background md:-bottom-8 md:-left-8 md:w-40 md:border-8">
                  <ImagemResponsiva
                    src={flowers.url}
                    alt="Mulher de vestido branco segurando um ramo de flores secas"
                    sizes="(min-width: 768px) 160px, 112px"
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Sobre */}
        <section id="sobre" className="scroll-mt-24 py-28 md:py-36">
          <div className="mx-auto grid max-w-7xl grid-cols-1 gap-16 px-6 md:grid-cols-12 md:px-12">
            <div className="md:col-span-5">
              <p className="eyebrow text-primary/80">Sobre</p>
              <h2 className="mt-6 text-display text-5xl leading-tight text-primary md:text-6xl">
                Curadas
                <br />
                <span className="italic">para curar.</span>
              </h2>
            </div>
            <div className="md:col-span-6 md:col-start-7">
              <p className="text-xl leading-relaxed text-foreground/80">
                Com uma identidade delicada, feminina e atemporal, o projeto celebra mulheres que
                encontraram cura, força e propósito em sua caminhada de fé.
              </p>
              <p className="mt-6 text-lg leading-relaxed text-foreground/70">
                É um convite para viver a transformação, florescer em Cristo e refletir Sua graça
                por onde passar, porque quem é curada, também cura.
              </p>
              <div className="mt-10 text-primary">
                <span className="eyebrow">Est. em fé</span>
              </div>
            </div>
          </div>
        </section>

        {/* Pilares */}
        <section id="pilares" className="relative scroll-mt-24 py-28 md:py-36">
          <div
            className="absolute inset-0 -z-10"
            style={{
              background:
                "linear-gradient(180deg, transparent, color-mix(in oklch, var(--rose-soft) 25%, var(--cream)), transparent)",
            }}
          />
          <div className="mx-auto max-w-7xl px-6 md:px-12">
            <div className="mx-auto max-w-2xl text-center">
              <p className="eyebrow text-primary/80">Nossos pilares</p>
              <h2 className="mt-6 text-display text-5xl leading-tight text-primary md:text-6xl">
                Três palavras que nos <span className="italic">movem.</span>
              </h2>
            </div>
            <div className="mt-20 grid grid-cols-1 gap-10 md:grid-cols-3">
              {pillars.map((p, i) => (
                <div
                  key={p.title}
                  className="group relative rounded-3xl bg-card p-10 shadow-sm ring-1 ring-primary/5 transition-all hover:shadow-md"
                >
                  <span className="text-display text-6xl italic text-[color:var(--rose-deep)]/40">
                    0{i + 1}
                  </span>
                  <h3 className="mt-4 text-display text-3xl text-primary">{p.title}</h3>
                  <p className="mt-4 text-base leading-relaxed text-foreground/70">{p.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Gallery */}
        <section id="momentos" className="scroll-mt-24 py-24">
          <div className="mx-auto max-w-7xl px-6 md:px-12">
            <p className="eyebrow text-primary/80 text-center mb-4">Momentos</p>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
              <div className="col-span-2 row-span-2 aspect-[3/4] md:aspect-square overflow-hidden rounded-3xl relative">
                <ImagemResponsiva
                  src={momento1.url}
                  alt="Palestrante ao microfone diante do painel Mulheres Curadas"
                  sizes="(min-width: 1280px) 590px, (min-width: 768px) 46vw, 48vw"
                  className="h-full w-full object-cover object-top transition-transform duration-700 hover:scale-105"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-6">
                  <p className="eyebrow text-white/80">Momentos</p>
                  <p className="text-display text-2xl text-white italic mt-1">Mulheres Curadas</p>
                </div>
              </div>
              {momentos.map((m) => (
                <div key={m.asset.url} className="aspect-square overflow-hidden rounded-3xl">
                  <ImagemResponsiva
                    src={m.asset.url}
                    alt={m.alt}
                    sizes="(min-width: 1280px) 290px, (min-width: 768px) 23vw, 48vw"
                    className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
                  />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Depoimentos */}
        <Depoimentos />

        {/* Encontros / CTA */}
        <section id="encontros" className="scroll-mt-24 py-28 md:py-36">
          <div className="mx-auto max-w-5xl rounded-[2.5rem] bg-primary px-8 py-20 text-primary-foreground md:px-16">
            <div className="text-center">
              <p className="eyebrow opacity-70">Encontros · Retiros · Comunidade</p>
              <h2 className="mt-6 text-display text-5xl leading-tight md:text-7xl">
                Venha florescer <br /> <span className="italic">com a gente.</span>
              </h2>
              <p className="mx-auto mt-8 max-w-xl text-lg leading-relaxed opacity-80">
                Em breve nosso encontro.
              </p>
            </div>

            {/* A inscricao vive na sua propria pagina (/inscricao), que tem
              endereco curto para mandar no WhatsApp e no Instagram. Aqui fica
              so o convite, para o formulario existir num lugar so. */}
            <div id="inscricao" className="mt-14 scroll-mt-24 text-center">
              <Link
                to="/inscricao"
                className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-primary-foreground px-8 py-4 text-[0.68rem] sm:px-12 sm:text-xs uppercase tracking-[0.16em] sm:tracking-[0.3em] text-primary transition-all hover:opacity-90"
              >
                Fazer minha inscrição
              </Link>
              <p className="mt-5 text-sm opacity-70">Leva menos de um minuto.</p>
            </div>
          </div>
        </section>

        {/* Dúvidas */}
        <Duvidas />
      </main>

      {/* Footer */}
      <footer id="contato" className="scroll-mt-24 border-t border-primary/10 py-12">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-6 md:flex-row md:px-12">
          <div className="flex items-center gap-4">
            <img
              src={assetUrl(logoMonogram.url)}
              alt=""
              aria-hidden="true"
              width={349}
              height={522}
              className="h-14 w-auto"
            />
            <img
              src={assetUrl(logoWordmark.url)}
              alt="Mulheres Curadas"
              width={746}
              height={266}
              className="h-9 w-auto"
            />
          </div>
          <div className="flex flex-col items-center gap-2">
            <p className="eyebrow text-primary/80">Curadas para curar · MC</p>
            <a
              href={`mailto:${contato.email}`}
              className="inline-flex min-h-[44px] items-center text-sm text-primary underline-offset-4 transition-opacity hover:underline hover:opacity-80"
            >
              {contato.email}
            </a>

            {/* Redes e endereco so aparecem quando estiverem preenchidos em
                src/config/conteudo.ts — nada de link inventado. */}
            {(contato.instagram || contato.whatsapp) && (
              <div className="flex items-center gap-5">
                {contato.instagram && (
                  <a
                    href={contato.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Mulheres Curadas no Instagram"
                    className="inline-flex min-h-[44px] items-center text-primary transition-opacity hover:opacity-70"
                  >
                    <Instagram aria-hidden="true" className="h-5 w-5" />
                  </a>
                )}
                {contato.whatsapp && (
                  <a
                    href={contato.whatsapp}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Falar no WhatsApp${contato.whatsappTexto ? `: ${contato.whatsappTexto}` : ""}`}
                    className="inline-flex min-h-[44px] items-center gap-2 text-primary transition-opacity hover:opacity-70"
                  >
                    <MessageCircle aria-hidden="true" className="h-5 w-5" />
                    {contato.whatsappTexto && (
                      <span className="text-sm">{contato.whatsappTexto}</span>
                    )}
                  </a>
                )}
              </div>
            )}

            {contato.endereco && (
              <p className="flex items-center gap-2 text-center text-sm text-foreground/60">
                <MapPin aria-hidden="true" className="h-4 w-4 shrink-0 text-primary/50" />
                {contato.endereco}
              </p>
            )}
          </div>

          <div className="flex flex-col items-center gap-2 md:items-end">
            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1">
              <Link
                to="/politica-de-privacidade"
                className="inline-flex min-h-[44px] items-center text-xs text-primary/80 underline-offset-4 transition-colors hover:text-primary hover:underline"
              >
                Política de Privacidade
              </Link>
              {contato.termosDeUso && (
                <a
                  href={contato.termosDeUso}
                  className="inline-flex min-h-[44px] items-center text-xs text-primary/80 underline-offset-4 transition-colors hover:text-primary hover:underline"
                >
                  Termos de Uso
                </a>
              )}
            </div>
            <p className="text-xs text-foreground/65">
              © {new Date().getFullYear()} Mulheres Curadas
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
