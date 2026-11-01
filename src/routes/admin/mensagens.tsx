import { createFileRoute } from "@tanstack/react-router";
import { PaginaMensagens } from "@/components/admin/paginas/mensagens";

export const Route = createFileRoute("/admin/mensagens")({
  validateSearch: (busca: Record<string, unknown>): { id?: string } => ({
    id: typeof busca.id === "string" && busca.id ? busca.id : undefined,
  }),
  component: Pagina,
});

function Pagina() {
  const { id } = Route.useSearch();
  return <PaginaMensagens key={id ?? "lista"} id={id} />;
}
