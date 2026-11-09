import { useId, useRef, useState, type ReactNode } from "react";
import { ImagePlus, Loader2, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { enviarImagem, traduzirErro } from "@/lib/cms/util";

/* Estilos base do painel, no mesmo desenho da imagem de referencia. */
export const CAMPO =
  "w-full rounded-xl border border-border bg-white px-4 py-3 text-base text-foreground sm:py-2.5 sm:text-[15px] outline-none transition placeholder:text-foreground/35 focus:border-primary/50 focus:ring-4 focus:ring-primary/10 disabled:opacity-60";

export const BOTAO_PRIMARIO =
  "inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full bg-[color:var(--admin-vinho)] px-6 text-sm font-semibold text-white shadow-sm transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60";

export const BOTAO_SECUNDARIO =
  "inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full border border-[color:var(--admin-vinho)]/20 bg-white/60 px-6 text-sm font-semibold text-[color:var(--admin-vinho)] transition hover:border-[color:var(--admin-vinho)]/40 hover:bg-white disabled:opacity-60";

export const BOTAO_SUAVE =
  "inline-flex min-h-[40px] items-center justify-center gap-2 rounded-full bg-[color:var(--admin-rosado)] px-5 text-sm font-semibold text-[color:var(--admin-vinho)] transition hover:brightness-95 disabled:opacity-60";

export const CARTAO =
  "rounded-[1.75rem] border border-[color:var(--admin-linha)] bg-white shadow-[0_1px_2px_rgba(80,20,40,0.04),0_8px_24px_-12px_rgba(80,20,40,0.12)]";

export function CabecalhoPagina({
  titulo,
  descricao,
  acoes,
}: {
  titulo: string;
  descricao?: string;
  acoes?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
      <div>
        <h1 className="text-display text-4xl leading-tight text-[color:var(--admin-vinho)] md:text-5xl">
          {titulo}
        </h1>
        {descricao && <p className="mt-2 max-w-2xl text-[15px] text-foreground/65">{descricao}</p>}
      </div>
      {acoes && <div className="flex flex-wrap gap-3">{acoes}</div>}
    </div>
  );
}

export function Campo({
  rotulo,
  dica,
  children,
  className,
}: {
  rotulo: string;
  dica?: string;
  children: (id: string) => ReactNode;
  className?: string;
}) {
  const id = useId();
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={id} className="block text-sm font-semibold text-foreground/80">
        {rotulo}
      </label>
      {children(id)}
      {dica && <p className="text-xs text-foreground/55">{dica}</p>}
    </div>
  );
}

export function Interruptor({
  rotulo,
  descricao,
  marcado,
  aoMudar,
}: {
  rotulo: string;
  descricao?: string;
  marcado: boolean;
  aoMudar: (v: boolean) => void;
}) {
  const id = useId();
  return (
    <div className="flex items-start justify-between gap-4 rounded-2xl border border-[color:var(--admin-linha)] bg-[color:var(--admin-fundo)]/60 px-4 py-3">
      <label htmlFor={id} className="cursor-pointer">
        <span className="block text-sm font-semibold text-foreground/85">{rotulo}</span>
        {descricao && <span className="mt-0.5 block text-xs text-foreground/55">{descricao}</span>}
      </label>
      <Switch id={id} checked={marcado} onCheckedChange={aoMudar} />
    </div>
  );
}

export function Selo({
  tom = "verde",
  children,
}: {
  tom?: "verde" | "cinza" | "rosa" | "dourado";
  children: ReactNode;
}) {
  const cores = {
    verde: "bg-emerald-50 text-emerald-800 ring-emerald-200/70",
    cinza: "bg-stone-100 text-stone-600 ring-stone-200",
    rosa: "bg-[color:var(--admin-rosado)] text-[color:var(--admin-vinho)] ring-[color:var(--admin-vinho)]/10",
    dourado: "bg-amber-50 text-amber-800 ring-amber-200/70",
  } as const;
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full px-3 py-1 text-[0.65rem] font-bold uppercase tracking-[0.16em] ring-1",
        cores[tom],
      )}
    >
      {children}
    </span>
  );
}

export function Carregando({ texto = "Carregando" }: { texto?: string }) {
  return (
    <div
      className="flex items-center justify-center gap-3 py-16 text-sm text-foreground/55"
      role="status"
    >
      <Loader2
        className="h-5 w-5 animate-spin text-[color:var(--admin-vinho)]"
        aria-hidden="true"
      />
      {texto}…
    </div>
  );
}

export function EstadoVazio({
  icone,
  titulo,
  texto,
  acao,
}: {
  icone: ReactNode;
  titulo: string;
  texto?: string;
  acao?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center px-6 py-16 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[color:var(--admin-rosado)] text-[color:var(--admin-vinho)]">
        {icone}
      </span>
      <p className="mt-4 text-display text-2xl text-[color:var(--admin-vinho)]">{titulo}</p>
      {texto && <p className="mt-1 max-w-sm text-sm text-foreground/60">{texto}</p>}
      {acao && <div className="mt-6">{acao}</div>}
    </div>
  );
}

export function ErroCarregar({ erro }: { erro: unknown }) {
  return (
    <p role="alert" className="rounded-2xl bg-destructive/10 px-5 py-4 text-sm text-destructive">
      {traduzirErro(erro)}
    </p>
  );
}

export function ConfirmarExclusao({
  titulo,
  texto,
  aoConfirmar,
  children,
  rotuloAcao = "Excluir",
}: {
  titulo: string;
  texto: string;
  aoConfirmar: () => void | Promise<void>;
  children: ReactNode;
  rotuloAcao?: string;
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent className="rounded-3xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-display text-2xl text-[color:var(--admin-vinho)]">
            {titulo}
          </AlertDialogTitle>
          <AlertDialogDescription>{texto}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="rounded-full">Cancelar</AlertDialogCancel>
          <AlertDialogAction
            className="rounded-full bg-destructive text-white hover:bg-destructive/90"
            onClick={() => void aoConfirmar()}
          >
            {rotuloAcao}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function BotaoExcluir({
  rotulo = "Excluir",
  ...props
}: {
  rotulo?: string;
  titulo: string;
  texto: string;
  aoConfirmar: () => void | Promise<void>;
}) {
  return (
    <ConfirmarExclusao {...props}>
      <button
        type="button"
        className="inline-flex min-h-[40px] items-center gap-2 rounded-full px-4 text-sm font-semibold text-destructive transition hover:bg-destructive/10"
      >
        <Trash2 className="h-4 w-4" aria-hidden="true" />
        {rotulo}
      </button>
    </ConfirmarExclusao>
  );
}

/**
 * Campo de uma imagem so (banner, capa, foto de perfil). Envia na hora em que
 * a pessoa escolhe o arquivo e devolve a URL publica.
 */
export function CampoImagem({
  rotulo,
  valor,
  aoMudar,
  pasta,
  proporcao = "aspect-[16/9]",
  dica,
}: {
  rotulo: string;
  valor: string | null;
  aoMudar: (url: string | null) => void;
  pasta: string;
  proporcao?: string;
  dica?: string;
}) {
  const entrada = useRef<HTMLInputElement>(null);
  const [enviando, setEnviando] = useState(false);

  const escolher = async (arquivo: File | undefined) => {
    if (!arquivo) return;
    setEnviando(true);
    try {
      const { url } = await enviarImagem(arquivo, pasta);
      aoMudar(url);
      toast.success("Imagem enviada.");
    } catch (erro) {
      toast.error(traduzirErro(erro));
    } finally {
      setEnviando(false);
      if (entrada.current) entrada.current.value = "";
    }
  };

  return (
    <div className="space-y-1.5">
      <p className="text-sm font-semibold text-foreground/80">{rotulo}</p>
      <div
        className={cn(
          "group relative overflow-hidden rounded-2xl border-2 border-dashed border-[color:var(--admin-linha)] bg-[color:var(--admin-fundo)]",
          proporcao,
        )}
      >
        {valor ? (
          <>
            <img src={valor} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => aoMudar(null)}
              className="absolute top-3 right-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-foreground shadow transition hover:bg-white"
              aria-label="Remover imagem"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </>
        ) : null}
        <button
          type="button"
          onClick={() => entrada.current?.click()}
          disabled={enviando}
          className={cn(
            "absolute inset-0 flex flex-col items-center justify-center gap-2 text-sm font-semibold text-[color:var(--admin-vinho)] transition",
            valor
              ? "bg-black/0 opacity-0 hover:bg-black/35 hover:text-white hover:opacity-100 focus-visible:opacity-100"
              : "hover:bg-[color:var(--admin-rosado)]/50",
          )}
        >
          {enviando ? (
            <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" />
          ) : (
            <ImagePlus className="h-6 w-6" aria-hidden="true" />
          )}
          {enviando ? "Enviando…" : valor ? "Trocar imagem" : "Escolher imagem"}
        </button>
      </div>
      <input
        ref={entrada}
        type="file"
        accept="image/*"
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => void escolher(e.target.files?.[0])}
      />
      {dica && <p className="text-xs text-foreground/55">{dica}</p>}
    </div>
  );
}
