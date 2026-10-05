import { ClipboardList, QrCode, Sparkles } from "lucide-react";

/**
 * Passo a passo da inscricao, para a visitante saber o que acontece antes
 * mesmo de abrir o formulario. Aparece no convite da pagina inicial (sobre o
 * fundo vinho) e ao lado do formulario em /inscricao (sobre o fundo claro).
 */
const passos = [
  {
    icone: ClipboardList,
    titulo: "Preencha seus dados",
    texto: "Nome, telefone e e-mail. Leva menos de um minuto.",
  },
  {
    icone: QrCode,
    titulo: "Receba seu ingresso",
    texto: "O QR code aparece na tela na hora e também chega no seu e-mail.",
  },
  {
    icone: Sparkles,
    titulo: "Apresente na entrada",
    texto: "No dia do encontro, é só mostrar o QR code ou o código do ingresso.",
  },
];

export function PassosInscricao({
  claro = false,
  empilhado = false,
}: {
  claro?: boolean;
  /** Um passo embaixo do outro, para colunas estreitas. */
  empilhado?: boolean;
}) {
  return (
    <ol className={`grid gap-3 ${claro || empilhado ? "" : "md:grid-cols-3"}`}>
      {passos.map(({ icone: Icone, titulo, texto }, i) => (
        <li
          key={titulo}
          className={`flex gap-4 rounded-2xl p-5 text-left ${
            claro
              ? "bg-card ring-1 ring-primary/10"
              : "bg-primary-foreground/10 ring-1 ring-primary-foreground/20"
          }`}
        >
          <span
            aria-hidden="true"
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
              claro ? "bg-primary text-primary-foreground" : "bg-primary-foreground text-primary"
            }`}
          >
            <Icone className="h-5 w-5" />
          </span>
          <div>
            <p className={`eyebrow text-[0.6rem] ${claro ? "text-primary/70" : "opacity-70"}`}>
              Passo {i + 1}
            </p>
            <p className={`mt-1 text-display text-xl ${claro ? "text-primary" : ""}`}>{titulo}</p>
            <p
              className={`mt-1 text-sm leading-relaxed ${claro ? "text-foreground/70" : "opacity-80"}`}
            >
              {texto}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
