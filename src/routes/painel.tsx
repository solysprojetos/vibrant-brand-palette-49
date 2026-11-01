import { createFileRoute } from "@tanstack/react-router";
import { Painel } from "@/components/admin/paginas/inscricoes";

/**
 * Painel de inscricoes com endereco proprio (/painel).
 *
 * Quem esta logada no /admin entra direto; quem nao esta usa a senha do
 * painel (segredo PAINEL_SENHA da Edge Function "painel"), como antes.
 * O mesmo conteudo aparece dentro do /admin, em "Inscricoes" e "Sorteio".
 */
export const Route = createFileRoute("/painel")({
  // /painel?sorteio=true abre direto na tela do sorteio.
  validateSearch: (busca: Record<string, unknown>): { sorteio?: boolean } => ({
    sorteio:
      busca.sorteio === true || busca.sorteio === 1 || busca.sorteio === "1" ? true : undefined,
  }),
  component: Pagina,
  head: () => ({
    meta: [
      { title: "Painel de inscrições — Mulheres Curadas" },
      // Fora dos buscadores: esta pagina e so da organizacao.
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

function Pagina() {
  const { sorteio } = Route.useSearch();
  return <Painel sorteioInicial={sorteio} />;
}
