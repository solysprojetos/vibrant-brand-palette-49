import { createFileRoute } from "@tanstack/react-router";
import { PaginaEquipe } from "@/components/admin/paginas/equipe";

export const Route = createFileRoute("/admin/equipe")({
  component: Pagina,
});

function Pagina() {
  return <PaginaEquipe />;
}
