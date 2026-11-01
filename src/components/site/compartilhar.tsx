import { Share2 } from "lucide-react";
import { toast } from "sonner";

/** Usa o compartilhar do celular; no computador copia o link. */
export function BotaoCompartilhar({
  titulo,
  url,
  className = "",
}: {
  titulo: string;
  url?: string;
  className?: string;
}) {
  const compartilhar = async () => {
    const endereco = url ?? window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: titulo, url: endereco });
        return;
      } catch {
        return;
      }
    }
    try {
      await navigator.clipboard.writeText(endereco);
      toast.success("Link copiado.");
    } catch {
      window.prompt("Copie o link:", endereco);
    }
  };

  return (
    <button
      type="button"
      onClick={() => void compartilhar()}
      className={`inline-flex min-h-[44px] items-center gap-2 rounded-full border border-primary/25 px-5 text-xs uppercase tracking-[0.2em] text-primary transition hover:bg-primary hover:text-primary-foreground ${className}`}
    >
      <Share2 className="h-4 w-4" aria-hidden="true" />
      Compartilhar
    </button>
  );
}
