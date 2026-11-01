import { createFileRoute } from "@tanstack/react-router";
import { PaginaGaleria } from "@/components/admin/paginas/galeria";

export const Route = createFileRoute("/admin/galeria")({
  validateSearch: (busca: Record<string, unknown>): { album?: string } => ({
    album: typeof busca.album === "string" && busca.album ? busca.album : undefined,
  }),
  component: Pagina,
});

function Pagina() {
  const { album } = Route.useSearch();
  return <PaginaGaleria key={album ?? "lista"} album={album} />;
}
