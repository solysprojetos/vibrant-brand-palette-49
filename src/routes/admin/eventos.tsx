import { createFileRoute } from "@tanstack/react-router";
import { PaginaEventos } from "@/components/admin/paginas/eventos";

export const Route = createFileRoute("/admin/eventos")({
  validateSearch: (busca: Record<string, unknown>): { id?: string } => ({
    id: typeof busca.id === "string" && busca.id ? busca.id : undefined,
  }),
  component: Pagina,
});

function Pagina() {
  const { id } = Route.useSearch();
  return <PaginaEventos key={id ?? "lista"} id={id} />;
}
