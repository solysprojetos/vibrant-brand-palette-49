import { DOACAO } from "@/config/conteudo";

/** Lembrete do que levar no dia do encontro. */
export function AvisoDoacao({ className = "" }: { className?: string }) {
  return (
    <p className={`text-display text-2xl leading-snug text-foreground/80 md:text-3xl ${className}`}>
      <strong className="font-semibold text-primary">{DOACAO}</strong> no dia do encontro.
    </p>
  );
}
