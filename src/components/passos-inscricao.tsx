/**
 * Passo a passo da inscricao, para a visitante saber o que acontece antes
 * mesmo de abrir o formulario. Aparece no convite da pagina inicial (so o
 * texto, com uma linha ao lado) e em cartoes ao lado do formulario em /inscricao.
 */
const passos = [
  {
    titulo: "Preencha seus dados",
    texto: "Nome, telefone e e-mail. Leva menos de um minuto.",
  },
  {
    titulo: "Receba seu ingresso",
    texto: "O QR code aparece na tela na hora e também chega no seu e-mail.",
  },
  {
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
    <ol
      className={`grid ${claro ? "gap-3" : "gap-6"} ${claro || empilhado ? "" : "md:grid-cols-3"}`}
    >
      {passos.map(({ titulo, texto }, i) => (
        <li
          key={titulo}
          className={`text-left ${
            claro
              ? "rounded-2xl bg-card p-5 ring-1 ring-primary/10"
              : "border-l-2 border-primary/30 pl-5"
          }`}
        >
          <p className={`eyebrow text-[0.6rem] text-primary/70`}>Passo {i + 1}</p>
          <p className="mt-1 text-base font-semibold text-primary">{titulo}</p>
          <p className={`mt-1 text-sm leading-relaxed text-foreground/70`}>{texto}</p>
        </li>
      ))}
    </ol>
  );
}
