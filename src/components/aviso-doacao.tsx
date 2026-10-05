import { HandHeart } from "lucide-react";
import { DOACAO } from "@/config/conteudo";

/** Lembrete do que levar no dia do encontro. */
export function AvisoDoacao({ className = "" }: { className?: string }) {
  return (
    <p
      className={`flex items-center gap-3 rounded-2xl border border-primary/20 bg-primary/5 px-5 py-4 text-left text-sm leading-relaxed text-foreground/80 ${className}`}
    >
      <HandHeart aria-hidden="true" className="h-5 w-5 shrink-0 text-primary" />
      <span>
        <strong className="font-semibold text-primary">{DOACAO}</strong> no dia do encontro.
      </span>
    </p>
  );
}
