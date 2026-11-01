import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Cliente do Supabase usado pelo site e pelo painel /admin.
 *
 * A chave abaixo e a PUBLISHABLE — publica por definicao (a mesma do robo que
 * mantem o banco acordado). Ela so enxerga o que as politicas RLS liberam:
 * conteudo publicado para visitantes e o resto apenas para quem entrou no
 * painel com login. A chave service_role nunca entra no navegador.
 *
 * Para apontar para outro projeto, defina VITE_SUPABASE_URL e
 * VITE_SUPABASE_PUBLISHABLE_KEY no ambiente de build.
 */
export const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL ?? "https://vdjovchltmyhuvlwxzwr.supabase.co";
const SUPABASE_KEY =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? "sb_publishable_wLOjg2iczMMuH55bjjXLDw_zEBiQRYN";

/** Bucket das fotos, banners e capas. */
export const BUCKET_IMAGENS = "mc-imagens";

let cliente: SupabaseClient | undefined;

/** O cliente so nasce no navegador: no pre-render nao ha sessao nem rede. */
export function supabase(): SupabaseClient {
  if (!cliente) {
    cliente = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: {
        persistSession: typeof window !== "undefined",
        autoRefreshToken: typeof window !== "undefined",
        storageKey: "mc-admin-sessao",
      },
    });
  }
  return cliente;
}
