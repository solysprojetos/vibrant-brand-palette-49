import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { EM_BREVE, duvidas, proximoEncontro } from "@/config/conteudo";

/**
 * Perguntas frequentes, em acordeao discreto.
 *
 * As respostas vem de src/config/conteudo.ts. Duas delas se montam sozinhas a
 * partir dos dados do proximo encontro, para nao precisarem ser atualizadas em
 * dois lugares. Resposta vazia mostra "Informacoes em breve" — nada e suposto.
 */
function respostaDe(pergunta: string, resposta: string): string {
  if (resposta.trim()) return resposta;

  if (pergunta === "O encontro é gratuito?" && proximoEncontro.investimento.trim()) {
    return /gratuit/i.test(proximoEncontro.investimento)
      ? "Sim. O próximo encontro é gratuito."
      : `Investimento do próximo encontro: ${proximoEncontro.investimento}.`;
  }

  if (pergunta === "Onde acontecerá o próximo encontro?") {
    const partes = [proximoEncontro.local, proximoEncontro.endereco]
      .map((p) => p.trim())
      .filter(Boolean);
    if (partes.length) return partes.join(" — ");
  }

  return "";
}

export function Duvidas() {
  return (
    <section id="duvidas" className="scroll-mt-24 py-24 md:py-28">
      <div className="mx-auto max-w-3xl px-6 md:px-12">
        <div className="text-center">
          <p className="eyebrow text-primary/80">Dúvidas</p>
          <h2 className="mt-6 text-display text-4xl leading-tight text-primary md:text-5xl">
            Perguntas <span className="italic">frequentes.</span>
          </h2>
        </div>

        <Accordion type="single" collapsible className="mt-14">
          {duvidas.map((d, i) => {
            const resposta = respostaDe(d.pergunta, d.resposta);

            return (
              <AccordionItem
                key={d.pergunta}
                value={`duvida-${i}`}
                className="border-b border-primary/10"
              >
                {/* O <h3> do acordeao ja aplica a fonte display, entao a pergunta
                    sai em Cormorant sem classe extra — e o tailwind-merge
                    descartaria "text-display" aqui, por conflitar com text-primary. */}
                <AccordionTrigger className="py-6 text-left text-lg font-normal text-primary hover:no-underline hover:opacity-80 [&>svg]:text-primary/70">
                  {d.pergunta}
                </AccordionTrigger>
                <AccordionContent className="pb-6 pt-0">
                  <p
                    className={`max-w-2xl text-base leading-relaxed ${
                      resposta ? "text-foreground/70" : "italic text-foreground/65"
                    }`}
                  >
                    {resposta || EM_BREVE}
                  </p>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </div>
    </section>
  );
}
