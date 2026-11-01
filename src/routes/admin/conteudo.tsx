import { createFileRoute } from "@tanstack/react-router";
import { PaginaConteudo } from "@/components/admin/paginas/conteudo";

export const Route = createFileRoute("/admin/conteudo")({
  component: Pagina,
});

function Pagina() {
  return <PaginaConteudo />;
}
