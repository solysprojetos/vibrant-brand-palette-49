import { useEffect, useState } from "react";

/**
 * true so depois que a pagina abriu no navegador.
 *
 * O site e pre-gerado sem os parametros do endereco (?album=, ?p=, ?e=). Ler
 * esses parametros so depois de montar faz a primeira pintura bater com o
 * HTML pre-gerado, sem erro de hidratacao do React.
 */
export function useMontado(): boolean {
  const [montado, setMontado] = useState(false);
  useEffect(() => setMontado(true), []);
  return montado;
}
