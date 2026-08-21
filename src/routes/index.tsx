import { createFileRoute } from "@tanstack/react-router";
import { assetUrl } from "@/lib/asset-url";
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

const momentos = [momento2, momento3, momento4, momento5, momento6, momento7, momento8];


export const Route = createFileRoute("/")({
  component: Index,
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

function Index() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <header className="absolute top-0 left-0 right-0 z-20">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 md:px-12">
          <a href="#" className="flex items-center gap-3">
            <img src={assetUrl(logoMonogram.url)} alt="Monograma MC" className="h-11 w-auto md:h-14" />
            <span className="h-8 w-px bg-primary/15 md:h-10" />
            <img src={assetUrl(logoWordmark.url)} alt="Mulheres Curadas" className="h-8 w-auto md:h-10" />
          </a>
          <nav className="hidden gap-10 text-xs uppercase tracking-[0.3em] text-foreground/70 md:flex">
            <a href="#sobre" className="hover:text-primary transition-colors">Sobre</a>
            <a href="#pilares" className="hover:text-primary transition-colors">Pilares</a>
            <a href="#encontros" className="hover:text-primary transition-colors">Encontros</a>
            <a href="#inscricao" className="hover:text-primary transition-colors">Inscrição</a>
          </nav>
          <a
            href="#inscricao"
            className="hidden rounded-full border border-primary/30 px-5 py-2 text-xs uppercase tracking-[0.25em] text-primary transition-all hover:bg-primary hover:text-primary-foreground md:inline-block"
          >
            Inscreva-se
          </a>
        </div>
      </header>

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
                className="text-xs uppercase tracking-[0.3em] text-primary underline-offset-8 hover:underline"
              >
                Conheça a história
              </a>
            </div>
          </div>

          <div className="relative md:col-span-5">
            <div className="relative aspect-[3/4] overflow-hidden rounded-full">
              <img src={assetUrl(mirror.url)} alt="Reflexo" className="h-full w-full object-cover" />
            </div>
            <div className="absolute -bottom-8 -left-8 hidden aspect-square w-40 overflow-hidden rounded-full border-8 border-background md:block">
              <img src={assetUrl(flowers.url)} alt="Delicadeza" className="h-full w-full object-cover" />
            </div>
          </div>
        </div>
      </section>

      {/* Wordmark strip */}
      <section className="border-y border-primary/10 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-center gap-6 px-6 md:flex-row md:gap-10">
          <img src={assetUrl(logoMonogram.url)} alt="Monograma MC" className="h-24 w-auto md:h-32" />
          <img src={assetUrl(logoWordmark.url)} alt="Mulheres Curadas" className="h-14 w-auto md:h-20" />
        </div>
      </section>

      {/* Sobre */}
      <section id="sobre" className="py-28 md:py-36">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-16 px-6 md:grid-cols-12 md:px-12">
          <div className="md:col-span-5">
            <p className="eyebrow text-primary/70">Sobre</p>
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
            <div className="mt-10 flex items-center gap-4 text-primary">
              <img src={assetUrl(logoMonogram.url)} alt="MC" className="h-14 w-auto" />
              <div className="h-px flex-1 bg-primary/20" />
              <span className="eyebrow">Est. em fé</span>
            </div>
          </div>
        </div>
      </section>

      {/* Pilares */}
      <section id="pilares" className="relative py-28 md:py-36">
        <div
          className="absolute inset-0 -z-10"
          style={{
            background: "linear-gradient(180deg, transparent, color-mix(in oklch, var(--rose-soft) 25%, var(--cream)), transparent)",
          }}
        />
        <div className="mx-auto max-w-7xl px-6 md:px-12">
          <div className="mx-auto max-w-2xl text-center">
            <p className="eyebrow text-primary/70">Nossos pilares</p>
            <h2 className="mt-6 text-display text-5xl leading-tight text-primary md:text-6xl">
              Três palavras que nos <span className="italic">movem.</span>
            </h2>
          </div>
          <div className="mt-20 grid grid-cols-1 gap-10 md:grid-cols-3">
            {pillars.map((p, i) => (
              <div key={p.title} className="group relative rounded-3xl bg-card p-10 shadow-sm ring-1 ring-primary/5 transition-all hover:shadow-md">
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
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-6 md:px-12">
          <p className="eyebrow text-primary/70 text-center mb-4">Momentos</p>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
            <div className="col-span-2 row-span-2 aspect-[3/4] md:aspect-square overflow-hidden rounded-3xl relative">
              <img src={assetUrl(momento1.url)} alt="Mulheres Curadas" className="h-full w-full object-cover object-top transition-transform duration-700 hover:scale-105" />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-6">
                <p className="eyebrow text-white/80">Momentos</p>
                <p className="text-display text-2xl text-white italic mt-1">Mulheres Curadas</p>
              </div>
            </div>
            {momentos.map((m, i) => (
              <div key={i} className="aspect-square overflow-hidden rounded-3xl">
                <img src={assetUrl(m.url)} alt={`Momento ${i + 2}`} className="h-full w-full object-cover transition-transform duration-700 hover:scale-105" />
              </div>
            ))}
          </div>
        </div>
      </section>



      {/* Encontros / CTA */}
      <section id="encontros" className="py-28 md:py-36">
        <div className="mx-auto max-w-5xl rounded-[2.5rem] bg-primary px-8 py-20 text-primary-foreground md:px-16">
          <div className="text-center">
            <p className="eyebrow opacity-70">Encontros · Retiros · Comunidade</p>
            <h2 className="mt-6 text-display text-5xl leading-tight md:text-7xl">
              Venha florescer <br /> <span className="italic">com a gente.</span>
            </h2>
            <p className="mx-auto mt-8 max-w-xl text-lg leading-relaxed opacity-80">
              Encontros presenciais, círculos de oração e uma comunidade online para caminhar junto
              de outras mulheres que estão sendo curadas todos os dias.
            </p>
          </div>

          <div id="inscricao" className="mx-auto mt-14 max-w-xl rounded-[2rem] bg-primary-foreground/95 p-8 text-foreground shadow-lg md:p-10">
            <p className="eyebrow text-primary/70 text-center">Inscreva-se</p>
            <h3 className="mt-3 text-center text-display text-3xl text-primary md:text-4xl">
              Reserve seu <span className="italic">lugar.</span>
            </h3>
            <form
              className="mt-8 space-y-5"
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const data = new FormData(form);
                const nome = String(data.get("nome") || "");
                const telefone = String(data.get("telefone") || "");
                const email = String(data.get("email") || "");
                const body = encodeURIComponent(
                  `Nome: ${nome}\nTelefone: ${telefone}\nE-mail: ${email}`
                );
                window.location.href = `mailto:contato@mulherescuradas.com?subject=${encodeURIComponent(
                  "Nova inscrição Mulheres Curadas"
                )}&body=${body}`;
              }}
            >
              <div>
                <label htmlFor="nome" className="eyebrow text-primary/70">
                  Nome completo
                </label>
                <input
                  id="nome"
                  name="nome"
                  type="text"
                  required
                  maxLength={100}
                  autoComplete="name"
                  className="mt-2 w-full rounded-full border border-primary/20 bg-background px-6 py-3 text-base text-foreground outline-none transition-all placeholder:text-foreground/40 focus:border-primary focus:ring-2 focus:ring-[color:var(--rose-soft)]"
                  placeholder="Seu nome"
                />
              </div>
              <div>
                <label htmlFor="telefone" className="eyebrow text-primary/70">
                  Telefone
                </label>
                <input
                  id="telefone"
                  name="telefone"
                  type="tel"
                  required
                  maxLength={30}
                  autoComplete="tel"
                  className="mt-2 w-full rounded-full border border-primary/20 bg-background px-6 py-3 text-base text-foreground outline-none transition-all placeholder:text-foreground/40 focus:border-primary focus:ring-2 focus:ring-[color:var(--rose-soft)]"
                  placeholder="(00) 00000-0000"
                />
              </div>
              <div>
                <label htmlFor="email" className="eyebrow text-primary/70">
                  E-mail
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  maxLength={255}
                  autoComplete="email"
                  className="mt-2 w-full rounded-full border border-primary/20 bg-background px-6 py-3 text-base text-foreground outline-none transition-all placeholder:text-foreground/40 focus:border-primary focus:ring-2 focus:ring-[color:var(--rose-soft)]"
                  placeholder="voce@email.com"
                />
              </div>
              <button
                type="submit"
                className="mt-4 w-full rounded-full bg-primary px-10 py-4 text-xs uppercase tracking-[0.3em] text-primary-foreground transition-all hover:opacity-90"
              >
                Quero Participar
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-primary/10 py-12">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-6 md:flex-row md:px-12">
          <div className="flex items-center gap-4">
            <img src={assetUrl(logoMonogram.url)} alt="Monograma MC" className="h-14 w-auto" />
            <img src={assetUrl(logoWordmark.url)} alt="Mulheres Curadas" className="h-9 w-auto" />
          </div>
          <p className="eyebrow text-primary/60">Curadas para curar · MC</p>
          <p className="text-xs text-foreground/50">
            © {new Date().getFullYear()} Mulheres Curadas
          </p>
        </div>
      </footer>
    </div>
  );
}
