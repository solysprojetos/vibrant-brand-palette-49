import { Link } from "@tanstack/react-router";
import { Quote } from "lucide-react";
import { depoimentos as depoimentosFixos } from "@/config/conteudo";
import { useConteudoSite, usePublicacoesPublicas } from "@/lib/cms/consultas";

/**
 * "Historias de transformacao": tres cards prontos para depoimentos reais
 * de participantes. Enquanto src/config/conteudo.ts estiver sem conteudo,
 * os cards ficam em estado de espera — nenhum nome, foto ou frase e inventado.
 */
export function Depoimentos() {
  // Testemunhos marcados como "destaque" no painel /admin ocupam os cards.
  // Sem nenhum (ou com o banco fora do ar), ficam os de src/config/conteudo.ts.
  const { data: conteudo } = useConteudoSite();
  const { data: publicacoes } = usePublicacoesPublicas();
  const destaques = (publicacoes ?? [])
    .filter((p) => p.destaque && (p.resumo || p.conteudo).trim())
    .slice(0, 3)
    .map((p) => ({
      nome: p.autora || p.titulo,
      contexto: p.contexto,
      texto: p.resumo || p.conteudo,
      slug: p.slug,
    }));
  const usarPainel = conteudo?.inicio.mostrar_ultimas_mensagens !== false && destaques.length > 0;
  const depoimentos: { nome: string; contexto: string; texto: string; slug?: string }[] = usarPainel
    ? destaques
    : depoimentosFixos;
  const temMensagens = (publicacoes ?? []).length > 0;

  return (
    <section id="depoimentos" className="scroll-mt-24 py-24 md:py-28">
      <div className="mx-auto max-w-7xl px-6 md:px-12">
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow text-primary/80">Depoimentos</p>
          <h2 className="mt-6 text-display text-5xl leading-tight text-primary md:text-6xl">
            Histórias de <span className="italic">transformação.</span>
          </h2>
        </div>

        <ul className="mt-16 grid grid-cols-1 gap-10 md:grid-cols-3">
          {depoimentos.map((d, i) => {
            const preenchido = Boolean(d.texto.trim());

            return (
              <li
                key={i}
                className={`relative flex flex-col rounded-3xl bg-card p-10 shadow-sm ring-1 ring-primary/5 transition-all ${
                  preenchido ? "hover:shadow-md" : ""
                }`}
              >
                <Quote aria-hidden="true" className="h-8 w-8 text-[color:var(--rose-deep)]/40" />

                {preenchido ? (
                  <figure className="mt-6 flex flex-1 flex-col">
                    <blockquote className="flex-1 text-base leading-relaxed text-foreground/75">
                      <p className="line-clamp-[10]">{d.texto}</p>
                    </blockquote>
                    <figcaption className="mt-8">
                      <p className="text-display text-2xl text-primary">{d.nome}</p>
                      {d.contexto.trim() && (
                        <p className="eyebrow mt-2 text-[0.6rem] text-primary/50">{d.contexto}</p>
                      )}
                      {d.slug && (
                        <Link
                          to="/mensagens"
                          search={{ p: d.slug }}
                          className="mt-4 inline-flex min-h-[44px] items-center text-xs uppercase tracking-[0.2em] text-primary underline-offset-8 hover:underline"
                        >
                          Ler a história
                        </Link>
                      )}
                    </figcaption>
                  </figure>
                ) : (
                  <p className="mt-6 flex-1 text-base italic leading-relaxed text-foreground/65">
                    Em breve, a história de mais uma mulher curada.
                  </p>
                )}
              </li>
            );
          })}
        </ul>

        {temMensagens && (
          <div className="mt-12 text-center">
            <Link
              to="/mensagens"
              className="inline-flex min-h-[44px] items-center text-xs uppercase tracking-[0.3em] text-primary underline-offset-8 hover:underline"
            >
              Ver todas as mensagens e testemunhos
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
