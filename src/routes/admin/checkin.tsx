import { createFileRoute } from "@tanstack/react-router";
import { PaginaCheckin } from "@/components/admin/paginas/checkin";

export const Route = createFileRoute("/admin/checkin")({
  component: PaginaCheckin,
});
