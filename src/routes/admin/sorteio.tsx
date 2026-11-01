import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Painel } from "@/components/admin/paginas/inscricoes";

export const Route = createFileRoute("/admin/sorteio")({
  component: Pagina,
});

function Pagina() {
  const navegar = useNavigate();
  return (
    <Painel
      embutido
      sorteioInicial
      aoFecharSorteio={() => void navegar({ to: "/admin/inscricoes" })}
    />
  );
}
