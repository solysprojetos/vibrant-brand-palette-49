import { CalendarDays, Clock, MapPin, Ticket, BookOpen, Users } from "lucide-react";
import { EM_BREVE, proximoEncontro } from "@/config/conteudo";

/**
 * Bloco do proximo encontro, dentro da secao de encontros que ja existia.
 * Todo o conteudo vem de src/config/conteudo.ts — campo vazio vira
 * "Informacoes em breve", nunca um dado inventado.
 */

function Valor({ children }: { children: string }) {
  const vazio = !children.trim();
  return <span className={vazio ? "italic opacity-70" : ""}>{vazio ? EM_BREVE : children}</span>;
}

function Detalhe({
  icone: Icone,
  rotulo,
  valor,
}: {
  icone: typeof CalendarDays;
  rotulo: string;
  valor: string;
}) {
  return (
    <div className="min-w-0">
      <dt className="flex items-center gap-2">
        <Icone aria-hidden="true" className="h-4 w-4 shrink-0 opacity-70" />
        <span className="eyebrow text-[0.6rem] opacity-70">{rotulo}</span>
      </dt>
      <dd className="mt-2 pl-6 text-base leading-relaxed">
        <Valor>{valor}</Valor>
      </dd>
    </div>
  );
}

export function ProximoEncontro() {
  const e = proximoEncontro;

  // Enquanto nada estiver cadastrado, repetir "Informacoes em breve" em oito
  // linhas seria tudo menos discreto: o bloco aparece entao em versao curta,
  // com o convite para a inscricao. Basta preencher um campo em
  // src/config/conteudo.ts para a ficha completa entrar no lugar.
  const temAlgo =
    Boolean(
      [e.nome, e.data, e.horario, e.local, e.endereco, e.investimento, e.palavraCom, e.vagas].some(
        (campo) => campo.trim(),
      ),
    ) || e.programacao.length > 0;

  return (
    <div
      id="proximo-encontro"
      className="mx-auto mt-14 max-w-3xl scroll-mt-28 rounded-[2rem] bg-primary-foreground/10 p-8 ring-1 ring-primary-foreground/20 md:p-10"
    >
      <p className="eyebrow text-center opacity-70">Próximo encontro</p>
      <h3 className="mt-3 text-center text-display text-3xl leading-tight md:text-4xl">
        <Valor>{e.nome}</Valor>
      </h3>

      {temAlgo ? (
        <>
          <dl className="mt-10 grid grid-cols-1 gap-x-10 gap-y-7 sm:grid-cols-2">
            <Detalhe icone={CalendarDays} rotulo="Data" valor={e.data} />
            <Detalhe icone={Clock} rotulo="Horário" valor={e.horario} />
            <Detalhe icone={MapPin} rotulo="Local" valor={e.local} />
            <Detalhe icone={MapPin} rotulo="Endereço" valor={e.endereco} />
            <Detalhe icone={Ticket} rotulo="Investimento" valor={e.investimento} />
            <Detalhe icone={BookOpen} rotulo="Palavra com" valor={e.palavraCom} />
            <Detalhe icone={Users} rotulo="Vagas" valor={e.vagas} />
          </dl>

          <div className="mt-9 border-t border-primary-foreground/15 pt-8">
            <p className="eyebrow text-[0.6rem] opacity-70">Programação</p>
            {e.programacao.length > 0 ? (
              <ul className="mt-4 space-y-2.5">
                {e.programacao.map((item) => (
                  <li key={item} className="flex gap-3 text-base leading-relaxed">
                    <span
                      aria-hidden="true"
                      className="mt-2.5 h-1 w-1 shrink-0 rounded-full bg-current opacity-50"
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-base italic leading-relaxed opacity-70">{EM_BREVE}</p>
            )}
          </div>
        </>
      ) : (
        <p className="mx-auto mt-6 max-w-md text-center text-base leading-relaxed opacity-70">
          Data, horário, local e programação do próximo encontro aparecem aqui assim que forem
          confirmados. Deixe seu nome na lista e avisamos você.
        </p>
      )}

      <div className="mt-10 text-center">
        <a
          href="#inscricao"
          className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-primary-foreground px-6 py-4 text-[0.68rem] sm:px-8 sm:text-xs uppercase tracking-[0.16em] sm:tracking-[0.3em] text-primary transition-all hover:opacity-90"
        >
          Garantir minha vaga
        </a>
      </div>
    </div>
  );
}
