import { contato as contatoPadrao } from "@/config/conteudo";

/**
 * Textos editaveis pelo painel (tabela mc_conteudo). Cada chave tem valores
 * padrao — os mesmos textos que o site ja mostrava —, entao a pagina nunca
 * fica vazia enquanto nada foi salvo.
 */
export type ConteudoSobre = {
  titulo: string;
  introducao: string;
  historia: string;
  missao: string;
  visao: string;
  valores: string;
  proposito: string;
  imagem: string;
  idealizadora_nome: string;
  idealizadora_titulo: string;
  idealizadora_texto: string;
  idealizadora_foto: string;
};

export type ConteudoContato = {
  email: string;
  instagram: string;
  whatsapp: string;
  whatsapp_texto: string;
  endereco: string;
  mapa_url: string;
};

export type ConteudoInicio = {
  mensagem_idealizadora: string;
  mostrar_ultimas_mensagens: boolean;
};

export type ConteudoSite = {
  sobre: ConteudoSobre;
  contato: ConteudoContato;
  inicio: ConteudoInicio;
};

export const CONTEUDO_PADRAO: ConteudoSite = {
  sobre: {
    titulo: "Curadas para curar.",
    introducao:
      "Com uma identidade delicada, feminina e atemporal, o projeto celebra mulheres que encontraram cura, força e propósito em sua caminhada de fé.",
    historia:
      "É um convite para viver a transformação, florescer em Cristo e refletir Sua graça por onde passar, porque quem é curada, também cura.",
    missao: "",
    visao: "",
    valores: "",
    proposito: "",
    imagem: "",
    idealizadora_nome: "Karoline Rodrigues",
    idealizadora_titulo: "Idealizadora",
    idealizadora_texto: "",
    idealizadora_foto: "",
  },
  contato: {
    email: contatoPadrao.email,
    instagram: contatoPadrao.instagram,
    whatsapp: contatoPadrao.whatsapp,
    whatsapp_texto: contatoPadrao.whatsappTexto,
    endereco: contatoPadrao.endereco,
    mapa_url: "",
  },
  inicio: {
    mensagem_idealizadora: "",
    mostrar_ultimas_mensagens: true,
  },
};

/** Junta o que veio do banco com o padrao, ignorando campos vazios do banco so quando o padrao tem texto. */
export function mesclarConteudo(
  linhas: { chave: string; valor: Record<string, unknown> }[],
): ConteudoSite {
  const resultado = structuredClone(CONTEUDO_PADRAO) as unknown as Record<
    string,
    Record<string, unknown>
  >;
  for (const { chave, valor } of linhas) {
    if (!(chave in resultado) || !valor) continue;
    for (const [campo, v] of Object.entries(valor)) {
      if (v === null || v === undefined) continue;
      resultado[chave][campo] = v;
    }
  }
  return resultado as unknown as ConteudoSite;
}
