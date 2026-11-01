import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Album, Foto } from "./tipos";

/**
 * Leituras publicas da galeria. O site e estatico, entao os albuns do painel
 * sao buscados no navegador; se o banco nao responder, a pagina mostra so o
 * album fixo "Momentos" — nunca quebra.
 */
async function lancar<T>(promessa: PromiseLike<{ data: T | null; error: unknown }>): Promise<T> {
  const { data, error } = await promessa;
  if (error) throw error;
  return data as T;
}

const tempo = { staleTime: 60_000, retry: 1 } as const;

export type AlbumComTotal = Album & { total: number };

export function useAlbunsPublicos() {
  return useQuery({
    queryKey: ["publico", "albuns"],
    queryFn: async (): Promise<AlbumComTotal[]> => {
      const albuns = await lancar<Album[]>(
        supabase()
          .from("mc_albuns")
          .select("*")
          .eq("publicado", true)
          .order("data", { ascending: false }),
      );
      const ids = albuns.map((a) => a.id);
      const contagem = new Map<string, number>();
      if (ids.length) {
        const fotos = await lancar<{ album_id: string }[]>(
          supabase().from("mc_fotos").select("album_id").in("album_id", ids),
        );
        for (const f of fotos) contagem.set(f.album_id, (contagem.get(f.album_id) ?? 0) + 1);
      }
      return albuns.map((a) => ({ ...a, total: contagem.get(a.id) ?? 0 }));
    },
    ...tempo,
  });
}

export function useAlbumPublico(slug: string) {
  return useQuery({
    queryKey: ["publico", "album", slug],
    enabled: Boolean(slug),
    queryFn: async () => {
      const album = await lancar<Album | null>(
        supabase()
          .from("mc_albuns")
          .select("*")
          .eq("publicado", true)
          .eq("slug", slug)
          .maybeSingle(),
      );
      if (!album) return null;
      const fotos = await lancar<Foto[]>(
        supabase()
          .from("mc_fotos")
          .select("*")
          .eq("album_id", album.id)
          .order("ordem")
          .order("criado_em"),
      );
      return { album, fotos };
    },
    ...tempo,
  });
}
