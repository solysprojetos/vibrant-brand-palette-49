import { createFileRoute, Outlet } from "@tanstack/react-router";
import { EstruturaAdmin } from "@/components/admin/estrutura";

/**
 * Painel administrativo (/admin): login do Supabase Auth e gerenciamento de
 * eventos, galeria, mensagens, textos do site, equipe, contatos e usuarios.
 *
 * Fica fora dos buscadores. A pagina e estatica como o resto do site; quem
 * protege os dados sao as politicas RLS do banco, que so liberam escrita para
 * quem esta em mc_equipe_acesso.
 */
export const Route = createFileRoute("/admin")({
  component: () => (
    <EstruturaAdmin>
      <Outlet />
    </EstruturaAdmin>
  ),
  head: () => ({
    meta: [
      { title: "Painel administrativo — Mulheres Curadas" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});
