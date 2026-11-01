import { BUCKET_IMAGENS, supabase } from "@/lib/supabase";
import type { Evento } from "./tipos";

/** "Encontro de Novembro 2026!" -> "encontro-de-novembro-2026" */
export function gerarSlug(texto: string): string {
  return (
    texto
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 70) || "item"
  );
}

/** Slug com um sufixo curto, para dois itens com o mesmo titulo nao baterem. */
export function slugUnico(texto: string): string {
  const sufixo = crypto.getRandomValues(new Uint32Array(1))[0].toString(36).slice(0, 4);
  return `${gerarSlug(texto)}-${sufixo}`;
}

const FUSO = "America/Fortaleza";

export function formatarData(valor: string | Date, opcoes?: Intl.DateTimeFormatOptions): string {
  const data = typeof valor === "string" ? new Date(valor) : valor;
  return data.toLocaleDateString("pt-BR", {
    timeZone: FUSO,
    day: "numeric",
    month: "long",
    year: "numeric",
    ...opcoes,
  });
}

export function formatarHora(valor: string): string {
  return new Date(valor)
    .toLocaleTimeString("pt-BR", { timeZone: FUSO, hour: "2-digit", minute: "2-digit" })
    .replace(":00", "h")
    .replace(":", "h");
}

export function formatarDataHora(valor: string): string {
  return new Date(valor).toLocaleString("pt-BR", {
    timeZone: FUSO,
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Data "so dia" (coluna date) sem o deslocamento de fuso do new Date(). */
export function formatarDia(valor: string): string {
  const [ano, mes, dia] = valor.split("-").map(Number);
  return new Date(ano, mes - 1, dia).toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** Valor para <input type="datetime-local"> no fuso de Fortaleza (UTC-3). */
export function paraCampoDataHora(valor: string | null): string {
  if (!valor) return "";
  const d = new Date(new Date(valor).getTime() - 3 * 60 * 60 * 1000);
  return d.toISOString().slice(0, 16);
}

/** Le o <input type="datetime-local"> como horario de Fortaleza (UTC-3). */
export function deCampoDataHora(valor: string): string | null {
  if (!valor) return null;
  return new Date(`${valor}:00-03:00`).toISOString();
}

export type SituacaoEvento = "proximo" | "andamento" | "realizado";

/**
 * Proximo, em andamento ou realizado. A marca manual "realizado" vale sempre;
 * sem data de fim, o evento conta como em andamento ate 6h depois do inicio.
 */
export function situacaoDoEvento(
  e: Pick<Evento, "inicio" | "fim" | "realizado">,
  agora = Date.now(),
): SituacaoEvento {
  if (e.realizado) return "realizado";
  const inicio = new Date(e.inicio).getTime();
  const fim = e.fim ? new Date(e.fim).getTime() : inicio + 6 * 60 * 60 * 1000;
  if (agora < inicio) return "proximo";
  if (agora <= fim) return "andamento";
  return "realizado";
}

export const ROTULO_SITUACAO: Record<SituacaoEvento, string> = {
  proximo: "Próximo",
  andamento: "Em andamento",
  realizado: "Realizado",
};

/** Link do WhatsApp a partir de um numero digitado de qualquer jeito. */
export function linkWhatsapp(numeroOuLink: string, texto?: string): string {
  const valor = numeroOuLink.trim();
  if (!valor) return "";
  if (/^https?:\/\//i.test(valor)) return valor;
  const digitos = valor.replace(/\D/g, "");
  const numero = digitos.startsWith("55") ? digitos : `55${digitos}`;
  return `https://wa.me/${numero}${texto ? `?text=${encodeURIComponent(texto)}` : ""}`;
}

/** Endereco de incorporacao para links do YouTube e do Vimeo. */
export function videoIncorporado(url: string): string | null {
  const valor = url.trim();
  const yt = valor.match(
    /(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/|live\/)|youtu\.be\/)([\w-]{11})/,
  );
  if (yt) return `https://www.youtube-nocookie.com/embed/${yt[1]}`;
  const vimeo = valor.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;
  return null;
}

/** Largura e altura reais da foto, para a grade guardar a proporcao. */
export async function medirImagem(
  arquivo: File,
): Promise<{ largura: number; altura: number } | null> {
  try {
    const bitmap = await createImageBitmap(arquivo);
    const medida = { largura: bitmap.width, altura: bitmap.height };
    bitmap.close();
    return medida;
  } catch {
    return null;
  }
}

const TIPOS_ACEITOS = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
  "image/heic",
  "image/heif",
];
export const LIMITE_MB = 25;

/**
 * Envia a foto ORIGINAL para o Storage — sem recompressao, para preservar a
 * qualidade. Devolve a URL publica e o caminho (usado para apagar depois).
 */
export async function enviarImagem(
  arquivo: File,
  pasta: string,
): Promise<{ url: string; caminho: string }> {
  if (!TIPOS_ACEITOS.includes(arquivo.type)) {
    throw new Error(
      `"${arquivo.name}" não é uma imagem aceita (JPG, PNG, WebP, AVIF, GIF ou HEIC).`,
    );
  }
  if (arquivo.size > LIMITE_MB * 1024 * 1024) {
    throw new Error(`"${arquivo.name}" passa de ${LIMITE_MB} MB.`);
  }
  const extensao = (arquivo.name.split(".").pop() ?? "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
  const caminho = `${pasta}/${crypto.randomUUID()}.${extensao}`;
  const { error } = await supabase().storage.from(BUCKET_IMAGENS).upload(caminho, arquivo, {
    cacheControl: "31536000",
    contentType: arquivo.type,
    upsert: false,
  });
  if (error) throw new Error(traduzirErro(error));
  const { data } = supabase().storage.from(BUCKET_IMAGENS).getPublicUrl(caminho);
  return { url: data.publicUrl, caminho };
}

/** Caminho no bucket a partir da URL publica (para apagar banners trocados). */
export function caminhoDaUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const marcador = `/storage/v1/object/public/${BUCKET_IMAGENS}/`;
  const i = url.indexOf(marcador);
  return i === -1 ? null : decodeURIComponent(url.slice(i + marcador.length));
}

export async function apagarArquivos(caminhos: (string | null | undefined)[]): Promise<void> {
  const validos = caminhos.filter((c): c is string => Boolean(c));
  if (validos.length === 0) return;
  await supabase().storage.from(BUCKET_IMAGENS).remove(validos);
}

/** Mensagem de erro em portugues, sem jargao do banco. */
export function traduzirErro(erro: unknown): string {
  const mensagem =
    erro && typeof erro === "object" && "message" in erro
      ? String((erro as { message: unknown }).message)
      : String(erro ?? "");
  if (/invalid login credentials/i.test(mensagem)) return "E-mail ou senha incorretos.";
  if (/email not confirmed/i.test(mensagem)) return "Confirme o e-mail antes de entrar.";
  if (/row-level security|permission denied|not authorized|403/i.test(mensagem))
    return "Sem permissão para esta ação. Confira se o seu usuário tem acesso ao painel.";
  if (/duplicate key|already exists/i.test(mensagem)) return "Já existe um item com esse endereço.";
  if (/failed to fetch|network/i.test(mensagem))
    return "Sem conexão com o servidor. Verifique a internet.";
  if (/relation .* does not exist|could not find the table/i.test(mensagem))
    return "O banco ainda não foi preparado. Rode a migração do painel no Supabase (veja o manual).";
  if (/payload too large|exceeded the maximum/i.test(mensagem)) return "Arquivo grande demais.";
  if (!mensagem || mensagem === "{}" || mensagem === "[object Object]")
    return "Algo deu errado. Tente de novo.";
  return mensagem;
}
