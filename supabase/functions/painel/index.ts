/**
 * Painel de inscricoes: lista quem se inscreveu e da baixa na presenca.
 *
 * O banco continua fechado — nenhuma chave publica le a tabela. Quem le e so
 * esta funcao, e ela exige a senha do painel (segredo PAINEL_SENHA) em todo
 * pedido. Sem o segredo configurado, a funcao nao serve nada.
 */
import { createClient } from "jsr:@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-senha",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(corpo: unknown, status = 200): Response {
  return new Response(JSON.stringify(corpo), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

/**
 * Comparacao de tempo constante: sai sempre no mesmo tempo, acertando ou nao,
 * para que ninguem descubra a senha medindo a demora da resposta.
 */
function senhaConfere(recebida: string, esperada: string): boolean {
  const a = new TextEncoder().encode(recebida);
  const b = new TextEncoder().encode(esperada);
  let diferenca = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    diferenca |= (a[i] ?? 0) ^ (b[i] ?? 0);
  }
  return diferenca === 0;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ erro: "Método não permitido." }, 405);

  const esperada = Deno.env.get("PAINEL_SENHA");
  if (!esperada) {
    return json(
      { erro: "O painel ainda não tem senha. Configure o segredo PAINEL_SENHA na função." },
      503,
    );
  }

  const recebida = req.headers.get("x-senha") ?? "";
  if (!senhaConfere(recebida, esperada)) {
    // Um respiro antes de responder desanima quem fica tentando senhas.
    await new Promise((resolve) => setTimeout(resolve, 700));
    return json({ erro: "Senha incorreta." }, 401);
  }

  try {
    const { acao = "listar", codigo } = await req.json().catch(() => ({}));

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    if (acao === "checkin" || acao === "desfazer") {
      if (typeof codigo !== "string" || !codigo.trim()) {
        return json({ erro: "Informe o código do ingresso." }, 400);
      }
      const { data, error } = await supabase
        .from("inscricoes")
        .update({ checkin_em: acao === "checkin" ? new Date().toISOString() : null })
        .eq("codigo", codigo.trim().toUpperCase())
        .select("id, nome, codigo, checkin_em")
        .maybeSingle();

      if (error) throw error;
      if (!data) return json({ erro: "Código não encontrado." }, 404);
      return json({ ok: true, inscricao: data });
    }

    const { data, error } = await supabase
      .from("inscricoes")
      .select(
        "id, criado_em, nome, telefone, email, frequenta_igreja, igreja, codigo, email_enviado_em, checkin_em",
      )
      .order("criado_em", { ascending: false })
      .limit(2000);

    if (error) throw error;
    return json({ ok: true, inscricoes: data ?? [] });
  } catch (erro) {
    console.error(erro);
    return json({ erro: "Não foi possível carregar as inscrições." }, 500);
  }
});
