import { Quote } from "lucide-react";
import { depoimentos } from "@/config/conteudo";

/**
 * "Historias de transformacao": tres cards prontos para depoimentos reais
 * de participantes. Enquanto src/config/conteudo.ts estiver sem conteudo,
 * os cards ficam em estado de espera — nenhum nome, foto ou frase e inventado.
 */
export function Depoimentos() {
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
                      <p>{d.texto}</p>
                    </blockquote>
                    <figcaption className="mt-8">
                      <p className="text-display text-2xl text-primary">{d.nome}</p>
                      {d.contexto.trim() && (
                        <p className="eyebrow mt-2 text-[0.6rem] text-primary/50">{d.contexto}</p>
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
      </div>
    </section>
  );
}
