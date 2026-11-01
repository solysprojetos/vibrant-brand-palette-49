import { createFileRoute } from "@tanstack/react-router";
import { PaginaContatos } from "@/components/admin/paginas/contatos";

export const Route = createFileRoute("/admin/contatos")({
  component: Pagina,
});

function Pagina() {
  return <PaginaContatos />;
}
