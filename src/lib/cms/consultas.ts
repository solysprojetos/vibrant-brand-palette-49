import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { CONTEUDO_PADRAO, mesclarConteudo, type ConteudoSite } from "./conteudo";
import type { Album, Evento, Foto, MembroEquipe, Publicacao } from "./tipos";

/**
 * Leituras publicas (site). O site e estatico, entao tudo que vem do painel
 * e buscado no navegador. Se o banco nao responder, cada bloco simplesmente
 * mostra o conteudo padrao ou nao aparece — a pagina nunca quebra.
 */

async function lancar<T>(promessa: PromiseLike<{ data: T | null; error: unknown }>): Promise<T> {
  const { data, error } = await promessa;
  if (error) throw error;
  return data as T;
}

const tempo = { staleTime: 60_000, retry: 1 } as const;

export function useConteudoSite() {
  return useQuery({
    queryKey: ["publico", "conteudo"],
    queryFn: async (): Promise<ConteudoSite> => {
      const linhas = await lancar(supabase().from("mc_conteudo").select("chave, valor"));
      return mesclarConteudo((linhas ?? []) as { chave: string; valor: Record<string, unknown> }[]);
    },
    placeholderData: CONTEUDO_PADRAO,
    ...tempo,
  });
}

export function useEventosPublicos() {
  return useQuery({
    queryKey: ["publico", "eventos"],
    queryFn: () =>
      lancar<Evento[]>(
        supabase()
          .from("mc_eventos")
          .select("*")
          .eq("publicado", true)
          .order("inicio", { ascending: true }),
      ),
    ...tempo,
  });
}

export function useEventoPublico(slug: string) {
  return useQuery({
    queryKey: ["publico", "evento", slug],
    enabled: Boolean(slug),
    queryFn: () =>
      lancar<Evento | null>(
        supabase()
          .from("mc_eventos")
          .select("*")
          .eq("publicado", true)
          .eq("slug", slug)
          .maybeSingle(),
      ),
    ...tempo,
  });
}

export function useAlbunsPublicos() {
  return useQuery({
    queryKey: ["publico", "albuns"],
    queryFn: async () => {
      const albuns = await lancar<Album[]>(
        supabase()
          .from("mc_albuns")
          .select("*")
          .eq("publicado", true)
          .order("data", { ascending: false }),
      );
      // Quantidade de fotos de cada album, num pedido so.
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

export function usePublicacoesPublicas() {
  return useQuery({
    queryKey: ["publico", "publicacoes"],
    queryFn: () =>
      lancar<Publicacao[]>(
        supabase()
          .from("mc_publicacoes")
          .select("*")
          .eq("publicado", true)
          .order("publicado_em", { ascending: false }),
      ),
    ...tempo,
  });
}

export function usePublicacaoPublica(slug: string) {
  return useQuery({
    queryKey: ["publico", "publicacao", slug],
    enabled: Boolean(slug),
    queryFn: () =>
      lancar<Publicacao | null>(
        supabase()
          .from("mc_publicacoes")
          .select("*")
          .eq("publicado", true)
          .eq("slug", slug)
          .maybeSingle(),
      ),
    ...tempo,
  });
}

export function useEquipePublica() {
  return useQuery({
    queryKey: ["publico", "equipe"],
    queryFn: () =>
      lancar<MembroEquipe[]>(
        supabase().from("mc_equipe").select("*").eq("publicado", true).order("ordem").order("nome"),
      ),
    ...tempo,
  });
}

export { lancar };
