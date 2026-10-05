import { useEffect, useState } from "react";
import { ENDPOINT_INSCRICAO } from "@/config/conteudo";

export type Vagas = {
  /** null enquanto a resposta nao chegou, ou se o servidor nao soube dizer. */
  restantes: number | null;
  limite: number | null;
};

/**
 * Pergunta ao servidor quantas vagas ainda restam.
 *
 * Se a consulta falhar (sem internet, funcao antiga no ar), devolve null e o
 * site segue mostrando o formulario: o banco continua barrando a inscricao
 * alem do limite, entao ninguem passa do teto por causa disso.
 */
export function useVagas(): Vagas {
  const [vagas, setVagas] = useState<Vagas>({ restantes: null, limite: null });

  useEffect(() => {
    if (!ENDPOINT_INSCRICAO) return;
    let ativo = true;
    // text/plain pelo mesmo motivo do formulario: evita o OPTIONS de verificacao.
    fetch(ENDPOINT_INSCRICAO, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ acao: "vagas" }),
    })
      .then((resposta) => (resposta.ok ? resposta.json() : null))
      .then((dados) => {
        if (!ativo || !dados || typeof dados.restantes !== "number") return;
        setVagas({ restantes: dados.restantes, limite: Number(dados.limite) || null });
      })
      .catch(() => {});
    return () => {
      ativo = false;
    };
  }, []);

  return vagas;
}

/** Texto do selo de vagas: total enquanto nao ha resposta, restantes depois. */
export function textoDasVagas(vagas: Vagas, limitePadrao: number): string {
  const limite = vagas.limite ?? limitePadrao;
  if (vagas.restantes === null) return `${limite} vagas`;
  if (vagas.restantes === 0) return "Vagas esgotadas";
  return `Restam ${vagas.restantes} de ${limite} vagas`;
}
