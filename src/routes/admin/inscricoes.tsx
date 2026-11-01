import { createFileRoute } from "@tanstack/react-router";
import { Painel } from "@/components/admin/paginas/inscricoes";

export const Route = createFileRoute("/admin/inscricoes")({
  component: () => <Painel embutido />,
});
