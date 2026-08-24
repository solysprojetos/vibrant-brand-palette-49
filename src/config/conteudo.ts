/**
 * Conteudo editavel do site Mulheres Curadas.
 *
 * Este arquivo existe para que as informacoes que mudam a cada encontro
 * (data, local, vagas, depoimentos, respostas das duvidas) possam ser
 * atualizadas sem mexer no layout da pagina.
 *
 * REGRA: campo vazio ("") nao inventa nada — a pagina mostra discretamente
 * "Informacoes em breve" no lugar. Preencha somente com informacao real.
 */

/** Texto exibido quando um campo ainda nao foi preenchido. */
export const EM_BREVE = "Informações em breve";

export type ProximoEncontro = {
  /** Nome do encontro. Ex.: "Encontro Mulheres Curadas — 3a edicao" */
  nome: string;
  /** Data por extenso, como deve aparecer na tela. Ex.: "20 de setembro de 2026" */
  data: string;
  /** Horario. Ex.: "das 19h as 22h" */
  horario: string;
  /** Nome do lugar. Ex.: "Igreja Batista Central" */
  local: string;
  /** Endereco completo do lugar. */
  endereco: string;
  /** "Gratuito" ou o valor real. Ex.: "Gratuito" / "R$ 50,00" */
  investimento: string;
  /** Quem traz a palavra no encontro. */
  palavraCom: string;
  /** Programacao resumida, um item por linha da lista. */
  programacao: string[];
  /** Quantidade de vagas. Ex.: "80 vagas" */
  vagas: string;
  /**
   * Data e hora em formato ISO, usada SO pelos dados estruturados do Google
   * (nao aparece na tela). Ex.: "2026-09-20T19:00:00-03:00".
   * Deixe vazio enquanto a data nao estiver confirmada.
   */
  dataISO: string;
};

export const proximoEncontro: ProximoEncontro = {
  nome: "",
  data: "",
  horario: "",
  local: "",
  endereco: "",
  investimento: "",
  palavraCom: "",
  programacao: [],
  vagas: "",
  dataISO: "",
};

export type Depoimento = {
  /** Nome de quem deu o depoimento (peca autorizacao antes de publicar). */
  nome: string;
  /** Uma linha curta de contexto. Ex.: "Participante do 2o encontro" */
  contexto: string;
  /** O depoimento em si, com as palavras da propria pessoa. */
  texto: string;
};

/**
 * Tres espacos prontos para depoimentos reais de participantes.
 * Enquanto estiverem vazios, os cards aparecem em estado de espera —
 * nenhum nome ou frase e inventado.
 */
export const depoimentos: Depoimento[] = [
  { nome: "", contexto: "", texto: "" },
  { nome: "", contexto: "", texto: "" },
  { nome: "", contexto: "", texto: "" },
];

export type Duvida = {
  pergunta: string;
  /**
   * Resposta. Vazio mostra "Informacoes em breve" — nunca preencha com
   * suposicao. Algumas respostas sao montadas a partir do proximo encontro
   * (veja src/components/duvidas.tsx).
   */
  resposta: string;
};

export const duvidas: Duvida[] = [
  {
    pergunta: "Quem pode participar?",
    // Repete o convite que ja esta na pagina inicial, sem acrescentar criterio novo.
    resposta:
      "Mulheres Curadas é um espaço para mulheres que encontraram, ou ainda buscam, cura, força e propósito em sua caminhada de fé.",
  },
  {
    pergunta: "O encontro é gratuito?",
    // Montada a partir de proximoEncontro.investimento. Preencha aqui so se
    // quiser um texto diferente do valor cadastrado.
    resposta: "",
  },
  {
    pergunta: "Preciso fazer inscrição?",
    resposta:
      "Sim. A inscrição é feita na página de inscrição, pelo botão “Fazer minha inscrição”.",
  },
  {
    pergunta: "Posso levar uma convidada?",
    resposta: "",
  },
  {
    pergunta: "Onde acontecerá o próximo encontro?",
    // Montada a partir de proximoEncontro.local e .endereco.
    resposta: "",
  },
  {
    pergunta: "Como receberei a confirmação?",
    resposta: "",
  },
];

/**
 * Contato e redes. Campo vazio simplesmente nao aparece no rodape —
 * nada de link inventado.
 */
export const contato = {
  /** Ja usado no rodape desde a primeira versao do site. */
  email: "contato@mulherescuradas.com",
  /** Ex.: "https://www.instagram.com/mulherescuradas" */
  instagram: "",
  /** Link do WhatsApp. Ex.: "https://wa.me/5511900000000" */
  whatsapp: "",
  /** Como o numero deve aparecer escrito. Ex.: "(11) 90000-0000" */
  whatsappTexto: "",
  /** Endereco fixo do projeto, se houver. */
  endereco: "",
  /** Link para os Termos de Uso, quando existirem. */
  termosDeUso: "",
};

/** Endereco publico do site — vem do arquivo public/CNAME. */
export const SITE_URL = "https://www.mulherescuradas.com";

/**
 * Destino das inscricoes.
 *
 * Vazio (como esta hoje) = o formulario segue usando a integracao atual do
 * site: abre o aplicativo de e-mail da visitante com a inscricao preenchida
 * para contato@mulherescuradas.com. Nesse caminho a inscricao so chega depois
 * que ela toca em "enviar" no proprio aplicativo.
 *
 * Para que os dados fiquem registrados sozinhos, cole aqui o endereco de um
 * servico de formulario que aceite POST em JSON (Formspree, Getform, Basin,
 * n8n, Apps Script...). O e-mail continua valendo como reserva se o envio
 * falhar. Ex.: "https://formspree.io/f/xxxxxxxx"
 */
export const ENDPOINT_INSCRICAO = "";
