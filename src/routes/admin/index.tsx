import { createFileRoute } from "@tanstack/react-router";
import { PaginaDashboard } from "@/components/admin/paginas/dashboard";

export const Route = createFileRoute("/admin/")({
  component: Pagina,
});

function Pagina() {
  return <PaginaDashboard />;
}
