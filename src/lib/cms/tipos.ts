export type ItemProgramacao = { hora: string; titulo: string; descricao?: string };

export type Evento = {
  id: string;
  slug: string;
  titulo: string;
  resumo: string;
  descricao: string;
  banner_url: string | null;
  inicio: string;
  fim: string | null;
  local: string;
  endereco: string;
  mapa_url: string;
  programacao: ItemProgramacao[];
  informacoes: string;
  investimento: string;
  link_inscricao: string;
  whatsapp: string;
  publicado: boolean;
  realizado: boolean;
  criado_em: string;
  atualizado_em: string;
};

export type Album = {
  id: string;
  slug: string;
  titulo: string;
  descricao: string;
  data: string;
  evento_id: string | null;
  capa_url: string | null;
  publicado: boolean;
  criado_em: string;
  atualizado_em: string;
};

export type Foto = {
  id: string;
  album_id: string;
  url: string;
  caminho: string;
  legenda: string;
  largura: number | null;
  altura: number | null;
  ordem: number;
  criado_em: string;
};

export type TipoPublicacao = "testemunho" | "historia" | "mensagem" | "reflexao" | "video";

export type Publicacao = {
  id: string;
  slug: string;
  tipo: TipoPublicacao;
  titulo: string;
  autora: string;
  contexto: string;
  resumo: string;
  conteudo: string;
  imagem_url: string | null;
  video_url: string;
  destaque: boolean;
  publicado: boolean;
  publicado_em: string;
  criado_em: string;
  atualizado_em: string;
};

export type MembroEquipe = {
  id: string;
  nome: string;
  cargo: string;
  bio: string;
  foto_url: string | null;
  ordem: number;
  publicado: boolean;
};

export type Contato = {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  assunto: string;
  mensagem: string;
  lido: boolean;
  criado_em: string;
};

export type Acesso = {
  user_id: string;
  nome: string;
  email: string;
  papel: "admin" | "editor";
};

export const TIPOS_PUBLICACAO: Record<TipoPublicacao, { rotulo: string; plural: string }> = {
  testemunho: { rotulo: "Testemunho", plural: "Testemunhos" },
  historia: { rotulo: "História de transformação", plural: "Histórias" },
  mensagem: { rotulo: "Mensagem de fé", plural: "Mensagens" },
  reflexao: { rotulo: "Reflexão", plural: "Reflexões" },
  video: { rotulo: "Vídeo especial", plural: "Vídeos" },
};
