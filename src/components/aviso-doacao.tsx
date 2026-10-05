import { DOACAO } from "@/config/conteudo";

/** Lembrete do que levar no dia do encontro. */
export function AvisoDoacao({ className = "" }: { className?: string }) {
  return (
    <p className={`text-base leading-relaxed text-foreground/80 ${className}`}>
      <strong className="font-semibold text-primary">{DOACAO}</strong> no dia do encontro.
    </p>
  );
}
