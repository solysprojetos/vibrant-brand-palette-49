import { createFileRoute } from "@tanstack/react-router";
import { PaginaUsuarios } from "@/components/admin/paginas/usuarios";

export const Route = createFileRoute("/admin/usuarios")({
  component: Pagina,
});

function Pagina() {
  return <PaginaUsuarios />;
}
