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
 * Chave do disparo e chave do Resend embutidas so na versao publicada no
 * Supabase. No repositorio ficam vazias de proposito, porque ele e publico.
 * Os segredos LEMBRETE_CHAVE e RESEND_API_KEY tem prioridade quando existirem.
 */
const CHAVE_EMBUTIDA = "";
const RESEND_EMBUTIDA = "";

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

function mensagem(i: Inscrita) {
  return {
    from: Deno.env.get("EMAIL_REMETENTE") ?? "Mulheres Curadas <contato@mulherescuradas.com>",
    to: [i.email],
    reply_to: Deno.env.get("EMAIL_CONTATO") ?? undefined,
    subject: ASSUNTO,
    html: corpoDoEmail(i.nome, i.codigo),
  };
}

const espera = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Manda em lotes de ate 100 pelo envio em lote do Resend. */
async function enviarLote(chave: string, lote: Inscrita[]): Promise<boolean> {
  for (let tentativa = 0; tentativa < 3; tentativa++) {
    const resposta = await fetch("https://api.resend.com/emails/batch", {
      method: "POST",
      headers: { Authorization: `Bearer ${chave}`, "Content-Type": "application/json" },
      body: JSON.stringify(lote.map(mensagem)),
    });
    if (resposta.ok) return true;
    console.error("Resend recusou o lote:", resposta.status, await resposta.text());
    if (resposta.status !== 429 && resposta.status < 500) return false;
    await espera(1500 * (tentativa + 1));
  }
  return false;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ erro: "Método não permitido." }, 405);

  const chaveDisparo = Deno.env.get("LEMBRETE_CHAVE") || CHAVE_EMBUTIDA;
  if (!chaveDisparo || req.headers.get("x-chave") !== chaveDisparo) {
    return json({ erro: "Não autorizado." }, 401);
  }
  const resend = Deno.env.get("RESEND_API_KEY") || RESEND_EMBUTIDA;
  if (!resend) return json({ erro: "RESEND_API_KEY ausente." }, 500);

  try {
    const dados = await req.json().catch(() => ({}));
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    if (dados.acao === "teste") {
      const email = String(dados.email ?? "").trim();
      if (!email) return json({ erro: "Informe o e-mail do teste." }, 400);
      const ok = await enviarLote(resend, [
        { id: "teste", nome: String(dados.nome ?? "Maria"), email, codigo: "MC-TEST-E123" },
      ]);
      return json({ ok });
    }

    const { data, error } = await supabase
      .from("inscricoes")
      .select("id, nome, email, codigo")
      .is("lembrete_enviado_em", null)
      .order("criado_em");
    if (error) throw error;
    const pendentes = (data ?? []) as Inscrita[];

    if (dados.acao !== "enviar") return json({ ok: true, pendentes: pendentes.length });

    let enviadas = 0;
    let falhas = 0;
    for (let i = 0; i < pendentes.length; i += 100) {
      const lote = pendentes.slice(i, i + 100);
      if (await enviarLote(resend, lote)) {
        const { error: erroMarca } = await supabase
          .from("inscricoes")
          .update({ lembrete_enviado_em: new Date().toISOString() })
          .in(
            "id",
            lote.map((x) => x.id),
          );
        if (erroMarca) console.error("Falha ao registrar o envio:", erroMarca);
        enviadas += lote.length;
      } else {
        falhas += lote.length;
      }
      await espera(700);
    }
    return json({ ok: falhas === 0, enviadas, falhas });
  } catch (erro) {
    console.error(erro);
    return json({ erro: "Falha no disparo." }, 500);
  }
});
