import { useCallback, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import type { Foto } from "@/lib/cms/tipos";
import { BotaoCompartilhar } from "./compartilhar";

/**
 * Foto ampliada com navegacao: setas da tela, setas do teclado, Esc para
 * fechar e deslizar o dedo no celular. A foto aparece inteira, na proporcao
 * original (object-contain), sem corte.
 */
export function Lightbox({
  fotos,
  indice,
  aoMudar,
  aoFechar,
  tituloAlbum,
}: {
  fotos: Foto[];
  indice: number;
  aoMudar: (i: number) => void;
  aoFechar: () => void;
  tituloAlbum: string;
}) {
  const foto = fotos[indice];
  const toqueX = useRef<number | null>(null);
  const fechar = useRef<HTMLButtonElement>(null);

  const anterior = useCallback(
    () => aoMudar((indice - 1 + fotos.length) % fotos.length),
    [indice, fotos.length, aoMudar],
  );
  const proxima = useCallback(
    () => aoMudar((indice + 1) % fotos.length),
    [indice, fotos.length, aoMudar],
  );

  useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      if (e.key === "Escape") aoFechar();
      if (e.key === "ArrowLeft") anterior();
      if (e.key === "ArrowRight") proxima();
    };
    window.addEventListener("keydown", tecla);
    const rolagem = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    fechar.current?.focus();
    return () => {
      window.removeEventListener("keydown", tecla);
      document.body.style.overflow = rolagem;
    };
  }, [anterior, proxima, aoFechar]);

  // Pre-carrega a vizinha, para a troca ser instantanea.
  useEffect(() => {
    const vizinha = fotos[(indice + 1) % fotos.length];
    if (vizinha) new Image().src = vizinha.url;
  }, [indice, fotos]);

  if (!foto) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Foto ${indice + 1} de ${fotos.length}`}
      className="fixed inset-0 z-[60] flex flex-col bg-[#1d0b12]/95 text-white backdrop-blur-sm animate-in fade-in duration-200"
      onTouchStart={(e) => (toqueX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (toqueX.current === null) return;
        const delta = e.changedTouches[0].clientX - toqueX.current;
        if (Math.abs(delta) > 50) (delta > 0 ? anterior : proxima)();
        toqueX.current = null;
      }}
    >
      <div className="flex items-center justify-between gap-4 px-4 py-3 md:px-8">
        <p className="truncate text-xs uppercase tracking-[0.25em] text-white/70">
          {tituloAlbum} · {indice + 1} / {fotos.length}
        </p>
        <div className="flex items-center gap-2">
          <BotaoCompartilhar
            titulo={tituloAlbum}
            className="hidden border-white/30 text-white hover:bg-white hover:text-[#1d0b12] sm:inline-flex"
          />
          <button
            ref={fechar}
            type="button"
            onClick={aoFechar}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div
        className="relative flex min-h-0 flex-1 items-center justify-center px-2 md:px-20"
        onClick={(e) => e.target === e.currentTarget && aoFechar()}
      >
        <img
          key={foto.id}
          src={foto.url}
          alt={foto.legenda || `Foto ${indice + 1} de ${tituloAlbum}`}
          className="max-h-full max-w-full object-contain animate-in fade-in zoom-in-95 duration-300"
        />
        {fotos.length > 1 && (
          <>
            <button
              type="button"
              onClick={anterior}
              className="absolute left-2 inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/25 md:left-6"
              aria-label="Foto anterior"
            >
              <ChevronLeft className="h-6 w-6" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={proxima}
              className="absolute right-2 inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/25 md:right-6"
              aria-label="Próxima foto"
            >
              <ChevronRight className="h-6 w-6" aria-hidden="true" />
            </button>
          </>
        )}
      </div>

      <p className="min-h-[3.5rem] px-6 py-4 text-center text-display text-xl italic text-white/85">
        {foto.legenda}
      </p>
    </div>
  );
}
