/**
 * Recebe a inscricao do site, guarda no banco e responde com o codigo do
 * ingresso — o mesmo que vira QR code no e-mail de confirmacao.
 *
 * O banco fica leve de proposito: nao guardamos imagem nem PDF, so o codigo
 * curto. A imagem do QR e desenhada na hora do envio a partir desse codigo.
 */
import { createClient } from "jsr:@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

/** Alfabeto sem 0/O e 1/I: o codigo tambem e lido e digitado por gente. */
const ALFABETO = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function gerarCodigo(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  const letras = Array.from(bytes, (b) => ALFABETO[b % ALFABETO.length]).join("");
  return `MC-${letras.slice(0, 4)}-${letras.slice(4, 8)}`;
}

/** Endereco do site, para o QR levar a pagina que da baixa na presenca. */
const SITE = Deno.env.get("SITE_URL") ?? "https://www.mulherescuradas.com";

/**
 * O QR guarda o endereco da baixa de presenca, e nao so o codigo.
 *
 * Assim a camera comum do celular — a nativa, sem aplicativo nenhum — abre a
 * pagina de check-in ja com o ingresso identificado. A barra no fim de
 * "/checkin/" evita o desvio que o GitHub Pages faria sem ela.
 */
function urlDoCheckin(codigo: string): string {
  return `${SITE}/checkin/?c=${encodeURIComponent(codigo)}`;
}

function urlDoQr(codigo: string): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=600x600&margin=12&data=${encodeURIComponent(urlDoCheckin(codigo))}`;
}

function escapar(texto: string): string {
  return texto.replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] as string,
  );
}

function emailValido(valor: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(valor);
}

/** Primeiro nome com so a inicial maiuscula: o cadastro guarda tudo em caixa alta. */
function saudacaoDe(nome: string): string {
  const primeiro = nome.trim().split(/\s+/)[0] ?? "";
  return primeiro ? primeiro[0] + primeiro.slice(1).toLocaleLowerCase("pt-BR") : "";
}

function corpoDoEmail(nome: string, codigo: string): string {
  const saudacao = saudacaoDe(nome);
  const doacao = Deno.env.get("ENCONTRO_DOACAO") ?? "Leve 2 kg de alimento";
  // Data e horario confirmados pela organizacao; os segredos ENCONTRO_*
  // continuam podendo sobrescrever qualquer linha sem mexer no codigo.
  const data = Deno.env.get("ENCONTRO_DATA") ?? "9 de novembro de 2026, segunda-feira";
  const horario = Deno.env.get("ENCONTRO_HORARIO") ?? "às 18h30";
  const local = Deno.env.get("ENCONTRO_LOCAL") ?? "CC Visão Profética";
  const endereco =
    Deno.env.get("ENCONTRO_ENDERECO") ?? "Av. dos Marinheiros, 319 - Cidade Nova, Maracanaú - CE";

  const linha = (rotulo: string, valor: string) =>
    `<p style="margin:0 0 6px;font-size:15px;line-height:1.6;color:#3c2f2b"><strong style="font-weight:700">${rotulo}:</strong> ${escapar(valor)}</p>`;

  return `<!doctype html>
<html lang="pt-BR"><body style="margin:0;background:#faf6f3;font-family:Helvetica,Arial,sans-serif;color:#3c2f2b">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#fff;border-radius:20px;padding:36px 28px">
        <tr><td align="center">
          <p style="margin:0;font-size:11px;letter-spacing:.28em;text-transform:uppercase;color:#b41a40">Mulheres Curadas</p>
          <h1 style="margin:14px 0 0;font-family:Georgia,'Times New Roman',serif;font-size:26px;font-weight:400;color:#b41a40">Sua vaga está garantida${saudacao ? `, ${escapar(saudacao)}` : ""}.</h1>
          <p style="margin:12px 0 0;font-size:15px;line-height:1.6;color:#5c4a45">Na entrada do encontro é só apresentar o QR code abaixo.</p>
          <img src="${urlDoQr(codigo)}" alt="QR code do seu ingresso: ${escapar(codigo)}" width="160" height="160" style="display:block;margin:24px auto 0;border-radius:12px;border:1px solid #eadfd9" />
          <p style="margin:12px 0 0;font-size:16px;letter-spacing:.18em;color:#b41a40">${escapar(codigo)}</p>
          <p style="margin:4px 0 0;font-size:12px;color:#8a7a75">Se a imagem não aparecer, mostre este código na entrada.</p>
        </td></tr>
        <tr><td style="padding-top:24px;border-top:1px solid #eadfd9" align="left">
          <table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px auto 0;max-width:360px"><tr><td>
          ${linha("Data", `${data}, ${horario}`)}
          ${linha("Local", local)}
          ${linha("Endereço", endereco)}
          </td></tr></table>
        </td></tr>
        <tr><td align="center">
          <p style="margin:28px 0 0;font-family:Georgia,'Times New Roman',serif;font-size:26px;line-height:1.3;color:#b41a40">${escapar(doacao)}</p>
          <p style="margin:24px 0 0;font-size:13px;line-height:1.6;color:#8a7a75">Qualquer dúvida, é só responder esta mensagem. Até logo!</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

/**
 * Chave do Resend embutida na versao publicada, como a senha do painel: no
 * repositorio ela fica vazia de proposito, porque ele e publico. O segredo
 * RESEND_API_KEY tem prioridade quando existir.
 */
const RESEND_EMBUTIDA = "";

async function enviarEmail(para: string, nome: string, codigo: string): Promise<boolean> {
  const chave = Deno.env.get("RESEND_API_KEY") || RESEND_EMBUTIDA;
  if (!chave) {
    console.warn("RESEND_API_KEY ausente: inscricao salva, e-mail nao enviado.");
    return false;
  }

  const resposta = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${chave}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: Deno.env.get("EMAIL_REMETENTE") ?? "Mulheres Curadas <contato@mulherescuradas.com>",
      to: [para],
      reply_to: Deno.env.get("EMAIL_CONTATO") ?? undefined,
      subject: "Sua inscrição está confirmada — Mulheres Curadas",
      html: corpoDoEmail(nome, codigo),
    }),
  });

  if (!resposta.ok) {
    console.error("Resend recusou o envio:", resposta.status, await resposta.text());
    return false;
  }
  return true;
}

/**
 * Manda o ingresso pelo WhatsApp, pela API oficial da Meta.
 *
 * So funciona com uma conta WhatsApp Business aprovada e um modelo de mensagem
 * ("template") ja liberado pela Meta — quem nunca escreveu para o numero da
 * organizacao so pode ser abordado por um modelo aprovado. Sem os segredos
 * configurados, a funcao nao tenta nada e a inscricao segue normal.
 *
 * O modelo precisa ter tres campos no corpo, nesta ordem: primeiro nome,
 * codigo do ingresso e o endereco do QR code.
 */
async function enviarWhatsapp(telefone: string, nome: string, codigo: string): Promise<boolean> {
  const token = Deno.env.get("WHATSAPP_TOKEN");
  const numeroRemetente = Deno.env.get("WHATSAPP_PHONE_ID");
  const modelo = Deno.env.get("WHATSAPP_TEMPLATE");
  if (!token || !numeroRemetente || !modelo) return false;

  // A Meta quer so digitos, com o codigo do pais na frente.
  const digitos = telefone.replace(/\D/g, "");
  const destino = digitos.startsWith("55") ? digitos : `55${digitos}`;

  const resposta = await fetch(`https://graph.facebook.com/v21.0/${numeroRemetente}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: destino,
      type: "template",
      template: {
        name: modelo,
        language: { code: Deno.env.get("WHATSAPP_IDIOMA") ?? "pt_BR" },
        components: [
          {
            type: "body",
            parameters: [
              { type: "text", text: saudacaoDe(nome) },
              { type: "text", text: codigo },
              { type: "text", text: urlDoQr(codigo) },
            ],
          },
        ],
      },
    }),
  });

  if (!resposta.ok) {
    console.error("WhatsApp recusou o envio:", resposta.status, await resposta.text());
    return false;
  }
  return true;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ erro: "Método não permitido." }), {
      status: 405,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }

  try {
    const dados = await req.json();

    // Consulta de vagas: o site pergunta antes de mostrar o formulario, para
    // avisar "vagas esgotadas" sem a visitante preencher tudo a toa.
    if (dados.acao === "vagas") {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      );
      const [{ data: limite, error: erroLimite }, { count, error: erroContagem }] =
        await Promise.all([
          supabase.rpc("limite_inscricoes"),
          supabase.from("inscricoes").select("id", { count: "exact", head: true }),
        ]);
      if (erroLimite) throw erroLimite;
      if (erroContagem) throw erroContagem;
      const inscritas = count ?? 0;
      return new Response(
        JSON.stringify({
          ok: true,
          limite,
          inscritas,
          restantes: Math.max(0, Number(limite) - inscritas),
        }),
        { headers: { ...CORS, "Content-Type": "application/json" } },
      );
    }

    const nome = String(dados.nome ?? "")
      .trim()
      .slice(0, 100);
    const telefone = String(dados.telefone ?? "")
      .trim()
      .slice(0, 20);
    const email = String(dados.email ?? "")
      .trim()
      .toLowerCase()
      .slice(0, 255);
    const frequentaIgreja = Boolean(dados.frequentaIgreja);
    const igreja = frequentaIgreja
      ? String(dados.igreja ?? "")
          .trim()
          .slice(0, 100)
      : null;

    if (nome.length < 3 || telefone.replace(/\D/g, "").length < 10 || !emailValido(email)) {
      return new Response(JSON.stringify({ erro: "Dados incompletos." }), {
        status: 400,
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Se a pessoa se inscrever de novo, o ingresso continua sendo o mesmo:
    // o codigo antigo e mantido e as mensagens sao so reenviadas.
    const { data: existente } = await supabase
      .from("inscricoes")
      .select("id, codigo, nome")
      .eq("email", email)
      .maybeSingle();

    let id = existente?.id as string | undefined;
    let codigo = existente?.codigo as string | undefined;

    if (!id) {
      codigo = gerarCodigo();
      const { data, error } = await supabase
        .from("inscricoes")
        .insert({
          codigo,
          nome,
          telefone,
          email,
          frequenta_igreja: frequentaIgreja,
          igreja,
          consentimento: true,
          origem: String(dados.origem ?? "site").slice(0, 60),
        })
        .select("id")
        .single();

      // O banco recusa a inscricao alem do limite (veja a migracao
      // limita_inscricoes). Quem ja estava inscrita nao passa por aqui: o
      // ingresso dela e so reenviado, mesmo com as vagas esgotadas.
      if (error?.message?.includes("LIMITE_DE_INSCRICOES")) {
        return new Response(
          JSON.stringify({ erro: "As vagas para este encontro esgotaram.", esgotado: true }),
          { status: 409, headers: { ...CORS, "Content-Type": "application/json" } },
        );
      }
      if (error) throw error;
      id = data.id;
    }

    const nomeFinal = nome || (existente?.nome as string) || "";

    // Os dois envios correm juntos, e um erro em qualquer um deles nao derruba
    // a inscricao — que ja esta gravada a esta altura.
    const [enviado, enviadoZap] = await Promise.all([
      enviarEmail(email, nomeFinal, codigo!).catch((erro) => {
        console.error("Falha ao enviar o e-mail:", erro);
        return false;
      }),
      enviarWhatsapp(telefone, nomeFinal, codigo!).catch((erro) => {
        console.error("Falha ao enviar o WhatsApp:", erro);
        return false;
      }),
    ]);

    const agora = new Date().toISOString();
    if (enviado || enviadoZap) {
      await supabase
        .from("inscricoes")
        .update({
          ...(enviado ? { email_enviado_em: agora } : {}),
          ...(enviadoZap ? { whatsapp_enviado_em: agora } : {}),
        })
        .eq("id", id!);
    }

    return new Response(
      JSON.stringify({ ok: true, codigo, emailEnviado: enviado, whatsappEnviado: enviadoZap }),
      {
        headers: { ...CORS, "Content-Type": "application/json" },
      },
    );
  } catch (erro) {
    console.error(erro);
    return new Response(JSON.stringify({ erro: "Não foi possível concluir a inscrição." }), {
      status: 500,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }
});
