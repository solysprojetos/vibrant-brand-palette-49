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

function urlDoQr(codigo: string): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=600x600&margin=12&data=${encodeURIComponent(codigo)}`;
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

function corpoDoEmail(nome: string, codigo: string): string {
  const primeiro = nome.trim().split(/\s+/)[0] ?? "";
  const saudacao = primeiro ? primeiro[0] + primeiro.slice(1).toLocaleLowerCase("pt-BR") : "";
  const encontro = [
    Deno.env.get("ENCONTRO_NOME"),
    Deno.env.get("ENCONTRO_DATA"),
    Deno.env.get("ENCONTRO_HORARIO"),
    Deno.env.get("ENCONTRO_LOCAL"),
    Deno.env.get("ENCONTRO_ENDERECO"),
  ].filter((linha): linha is string => Boolean(linha && linha.trim()));

  return `<!doctype html>
<html lang="pt-BR"><body style="margin:0;background:#faf6f3;font-family:Georgia,'Times New Roman',serif;color:#3c2f2b">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#fff;border-radius:24px;padding:40px 32px">
        <tr><td align="center">
          <p style="margin:0;font-size:11px;letter-spacing:.28em;text-transform:uppercase;color:#a9736a">Mulheres Curadas</p>
          <h1 style="margin:16px 0 0;font-size:28px;font-weight:400;color:#8b4f46">Sua vaga está garantida${saudacao ? `, ${escapar(saudacao)}` : ""}.</h1>
          <p style="margin:16px 0 0;font-size:15px;line-height:1.7;color:#5c4a45">
            Guarde este e-mail. Na entrada do encontro é só apresentar o QR code abaixo.
          </p>
          <img src="${urlDoQr(codigo)}" alt="QR code do seu ingresso: ${escapar(codigo)}" width="240" height="240" style="display:block;margin:28px auto 0;border-radius:16px;border:1px solid #eadfd9" />
          <p style="margin:16px 0 0;font-size:18px;letter-spacing:.18em;color:#8b4f46">${escapar(codigo)}</p>
          <p style="margin:6px 0 0;font-size:12px;color:#8a7a75">Se a imagem não aparecer, mostre este código na entrada.</p>
          ${
            encontro.length
              ? `<table role="presentation" width="100%" style="margin-top:28px;border-top:1px solid #eadfd9;padding-top:20px"><tr><td style="padding-top:20px;font-size:14px;line-height:1.9;color:#5c4a45;text-align:center">${encontro
                  .map((linha) => escapar(linha))
                  .join("<br />")}</td></tr></table>`
              : ""
          }
          <p style="margin:28px 0 0;font-size:13px;line-height:1.7;color:#8a7a75">
            Qualquer dúvida, é só responder esta mensagem. Até logo!
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

async function enviarEmail(para: string, nome: string, codigo: string): Promise<boolean> {
  const chave = Deno.env.get("RESEND_API_KEY");
  if (!chave) {
    console.warn("RESEND_API_KEY ausente: inscricao salva, e-mail nao enviado.");
    return false;
  }

  const resposta = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${chave}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: Deno.env.get("EMAIL_REMETENTE") ?? "Mulheres Curadas <onboarding@resend.dev>",
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
    // o codigo antigo e mantido e o e-mail e so reenviado.
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

      if (error) throw error;
      id = data.id;
    }

    const enviado = await enviarEmail(email, nome || (existente?.nome as string) || "", codigo!);
    if (enviado) {
      await supabase
        .from("inscricoes")
        .update({ email_enviado_em: new Date().toISOString() })
        .eq("id", id!);
    }

    return new Response(JSON.stringify({ ok: true, codigo, emailEnviado: enviado }), {
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  } catch (erro) {
    console.error(erro);
    return new Response(JSON.stringify({ erro: "Não foi possível concluir a inscrição." }), {
      status: 500,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }
});
