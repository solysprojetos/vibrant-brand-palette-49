/**
 * Disparo do lembrete da vespera: um e-mail para cada inscrita, com a data, o
 * local e o QR code do ingresso dela de novo, para ninguem precisar procurar a
 * confirmacao antiga na hora de entrar.
 *
 * Pedidos (POST, cabecalho x-chave com a chave do disparo):
 *   { "acao": "previa" }                 -> quantas ainda vao receber, nada sai
 *   { "acao": "teste", "email": "..." }  -> manda um exemplo so para esse endereco
 *   { "acao": "enviar" }                 -> manda para quem ainda nao recebeu
 *
 * Cada envio que da certo grava lembrete_enviado_em, entao repetir o "enviar"
 * so alcanca quem ficou de fora (por erro ou por ter se inscrito depois).
 */
import { createClient } from "jsr:@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-chave",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(corpo: unknown, status = 200): Response {
  return new Response(JSON.stringify(corpo), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

/**
 * Chave do disparo embutida so na versao publicada no Supabase. No
 * repositorio fica vazia de proposito, porque ele e publico. O segredo
 * LEMBRETE_CHAVE tem prioridade quando existir.
 *
 * O envio sai pelo Brevo (segredo BREVO_API_KEY). Se ele nao existir, a
 * funcao tenta o Resend (RESEND_API_KEY), que a inscricao ja usa.
 */
const CHAVE_EMBUTIDA = "";
const BREVO_EMBUTIDA = "";
const RESEND_EMBUTIDA = "";

const REMETENTE_NOME = Deno.env.get("EMAIL_REMETENTE_NOME") ?? "Mulheres Curadas";
// Precisa ser um remetente validado no Brevo; hoje so este e.
const REMETENTE_EMAIL = Deno.env.get("EMAIL_REMETENTE_EMAIL") ?? "solysprojetos@gmail.com";

const SITE = Deno.env.get("SITE_URL") ?? "https://www.mulherescuradas.com";

function urlDoQr(codigo: string): string {
  const checkin = `${SITE}/checkin/?c=${encodeURIComponent(codigo)}`;
  return `https://api.qrserver.com/v1/create-qr-code/?size=600x600&margin=12&data=${encodeURIComponent(checkin)}`;
}

function escapar(texto: string): string {
  return texto.replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] as string,
  );
}

/** Primeiro nome com so a inicial maiuscula: o cadastro guarda tudo em caixa alta. */
function saudacaoDe(nome: string): string {
  const primeiro = nome.trim().split(/\s+/)[0] ?? "";
  return primeiro ? primeiro[0] + primeiro.slice(1).toLocaleLowerCase("pt-BR") : "";
}

const DATA = Deno.env.get("ENCONTRO_DATA") ?? "amanhã, segunda-feira, 9 de novembro";
const HORARIO = Deno.env.get("ENCONTRO_HORARIO") ?? "às 18h30";
const LOCAL = Deno.env.get("ENCONTRO_LOCAL") ?? "CC Visão Profética";
const ENDERECO =
  Deno.env.get("ENCONTRO_ENDERECO") ?? "Av. dos Marinheiros, 319 - Cidade Nova, Maracanaú - CE";
const DOACAO = Deno.env.get("ENCONTRO_DOACAO") ?? "Leve 2 kg de alimento";
const ASSUNTO = "É amanhã! Seu encontro Mulheres Curadas — 9/11 às 18h30";

function corpoDoEmail(nome: string, codigo: string): string {
  const saudacao = saudacaoDe(nome);
  const mapa = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${LOCAL}, ${ENDERECO}`)}`;
  const linha = (rotulo: string, valor: string) =>
    `<p style="margin:0 0 6px;font-size:15px;line-height:1.6;color:#3c2f2b"><strong style="font-weight:700">${rotulo}:</strong> ${escapar(valor)}</p>`;

  return `<!doctype html>
<html lang="pt-BR"><body style="margin:0;background:#faf6f3;font-family:Helvetica,Arial,sans-serif;color:#3c2f2b">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#fff;border-radius:20px;padding:36px 28px">
        <tr><td align="center">
          <p style="margin:0;font-size:11px;letter-spacing:.28em;text-transform:uppercase;color:#b41a40">Mulheres Curadas</p>
          <h1 style="margin:14px 0 0;font-family:Georgia,'Times New Roman',serif;font-size:28px;font-weight:400;color:#b41a40">É amanhã${saudacao ? `, ${escapar(saudacao)}` : ""}!</h1>
          <p style="margin:12px 0 0;font-size:15px;line-height:1.6;color:#5c4a45">Estamos preparando tudo com muito carinho para receber você. Na entrada, é só apresentar o QR code abaixo.</p>
          <img src="${urlDoQr(codigo)}" alt="QR code do seu ingresso: ${escapar(codigo)}" width="160" height="160" style="display:block;margin:24px auto 0;border-radius:12px;border:1px solid #eadfd9" />
          <p style="margin:12px 0 0;font-size:16px;letter-spacing:.18em;color:#b41a40">${escapar(codigo)}</p>
          <p style="margin:4px 0 0;font-size:12px;color:#8a7a75">Se a imagem não aparecer, mostre este código na entrada.</p>
        </td></tr>
        <tr><td style="padding-top:24px" align="left">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #eadfd9"><tr><td style="padding-top:20px">
          ${linha("Quando", `${DATA}, ${HORARIO}`)}
          ${linha("Local", LOCAL)}
          ${linha("Endereço", ENDERECO)}
          <p style="margin:10px 0 0;font-size:14px"><a href="${mapa}" style="color:#b41a40">Abrir no mapa</a></p>
          <p style="margin:14px 0 0;font-size:14px;line-height:1.6;color:#5c4a45">Chegue com um pouquinho de antecedência para a entrada ser tranquila.</p>
          </td></tr></table>
        </td></tr>
        <tr><td align="center">
          <p style="margin:28px 0 0;font-family:Georgia,'Times New Roman',serif;font-size:26px;line-height:1.3;color:#b41a40">${escapar(DOACAO)}</p>
          <p style="margin:24px 0 0;font-size:13px;line-height:1.6;color:#8a7a75">Qualquer dúvida, é só responder esta mensagem. Até amanhã!</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

type Inscrita = { id: string; nome: string; email: string; codigo: string };

type Transporte = { nome: "brevo" | "resend"; chave: string };

function transporte(): Transporte | null {
  const brevo = Deno.env.get("BREVO_API_KEY") || BREVO_EMBUTIDA;
  if (brevo) return { nome: "brevo", chave: brevo };
  const resend = Deno.env.get("RESEND_API_KEY") || RESEND_EMBUTIDA;
  if (resend) return { nome: "resend", chave: resend };
  return null;
}

const espera = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Tenta ate tres vezes quando o servico pede calma (429) ou cai (5xx). */
async function comRepeticao(pedido: () => Promise<Response>, rotulo: string): Promise<boolean> {
  for (let tentativa = 0; tentativa < 3; tentativa++) {
    const resposta = await pedido();
    if (resposta.ok) return true;
    console.error(`${rotulo} recusou o envio:`, resposta.status, await resposta.text());
    if (resposta.status !== 429 && resposta.status < 500) return false;
    await espera(1500 * (tentativa + 1));
  }
  return false;
}

/** Um e-mail por pedido, como a API do Brevo prefere. */
function enviarBrevo(chave: string, i: Inscrita): Promise<boolean> {
  return comRepeticao(
    () =>
      fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "api-key": chave,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          sender: { name: REMETENTE_NOME, email: REMETENTE_EMAIL },
          to: [{ email: i.email, name: i.nome || undefined }],
          replyTo: Deno.env.get("EMAIL_CONTATO")
            ? { email: Deno.env.get("EMAIL_CONTATO") }
            : undefined,
          subject: ASSUNTO,
          htmlContent: corpoDoEmail(i.nome, i.codigo),
        }),
      }),
    "Brevo",
  );
}

/** O Resend aceita ate 100 mensagens num pedido so. */
function enviarResend(chave: string, lote: Inscrita[]): Promise<boolean> {
  return comRepeticao(
    () =>
      fetch("https://api.resend.com/emails/batch", {
        method: "POST",
        headers: { Authorization: `Bearer ${chave}`, "Content-Type": "application/json" },
        body: JSON.stringify(
          lote.map((i) => ({
            from: `${REMETENTE_NOME} <${REMETENTE_EMAIL}>`,
            to: [i.email],
            reply_to: Deno.env.get("EMAIL_CONTATO") ?? undefined,
            subject: ASSUNTO,
            html: corpoDoEmail(i.nome, i.codigo),
          })),
        ),
      }),
    "Resend",
  );
}

/** Devolve os ids que saíram. No Brevo vao de 8 em 8 ao mesmo tempo. */
async function enviarLote(t: Transporte, lote: Inscrita[]): Promise<string[]> {
  if (t.nome === "resend") return (await enviarResend(t.chave, lote)) ? lote.map((i) => i.id) : [];
  const ok: string[] = [];
  for (let i = 0; i < lote.length; i += 8) {
    const grupo = lote.slice(i, i + 8);
    const resultados = await Promise.all(grupo.map((x) => enviarBrevo(t.chave, x)));
    resultados.forEach((deuCerto, k) => deuCerto && ok.push(grupo[k].id));
    await espera(300);
  }
  return ok;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ erro: "Método não permitido." }, 405);

  const chaveDisparo = Deno.env.get("LEMBRETE_CHAVE") || CHAVE_EMBUTIDA;
  if (!chaveDisparo || req.headers.get("x-chave") !== chaveDisparo) {
    return json({ erro: "Não autorizado." }, 401);
  }
  const t = transporte();
  if (!t) return json({ erro: "Nenhuma chave de e-mail: configure BREVO_API_KEY." }, 500);

  try {
    const dados = await req.json().catch(() => ({}));
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    if (dados.acao === "teste") {
      const email = String(dados.email ?? "").trim();
      if (!email) return json({ erro: "Informe o e-mail do teste." }, 400);
      const ok = await enviarLote(t, [
        { id: "teste", nome: String(dados.nome ?? "Maria"), email, codigo: "MC-TEST-E123" },
      ]);
      return json({ ok: ok.length === 1, servico: t.nome });
    }

    const { data, error } = await supabase
      .from("inscricoes")
      .select("id, nome, email, codigo")
      .is("lembrete_enviado_em", null)
      .order("criado_em");
    if (error) throw error;
    const pendentes = (data ?? []) as Inscrita[];

    if (dados.acao !== "enviar") {
      return json({ ok: true, pendentes: pendentes.length, servico: t.nome });
    }

    let enviadas = 0;
    let falhas = 0;
    for (let i = 0; i < pendentes.length; i += 100) {
      const lote = pendentes.slice(i, i + 100);
      const saiu = await enviarLote(t, lote);
      if (saiu.length) {
        const { error: erroMarca } = await supabase
          .from("inscricoes")
          .update({ lembrete_enviado_em: new Date().toISOString() })
          .in("id", saiu);
        if (erroMarca) console.error("Falha ao registrar o envio:", erroMarca);
      }
      enviadas += saiu.length;
      falhas += lote.length - saiu.length;
    }
    return json({ ok: falhas === 0, enviadas, falhas, servico: t.nome });
  } catch (erro) {
    console.error(erro);
    return json({ erro: "Falha no disparo." }, 500);
  }
});
