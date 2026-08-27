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
 * Senha guardada dentro da propria funcao, em vez do segredo PAINEL_SENHA.
 *
 * Fica no formato "pbkdf2$<iteracoes>$<sal>$<hash>", nunca em texto puro. A
 * versao publicada no Supabase carrega o valor real; aqui no repositorio ela
 * segue vazia de proposito, porque este repositorio e publico e um hash a
 * vista so serve para quem quiser tentar quebra-lo.
 *
 * O segredo PAINEL_SENHA continua valendo e tem prioridade: assim que ele for
 * configurado, esta linha deixa de ser consultada e pode ser esquecida.
 */
const SENHA_EMBUTIDA = "";

/** Compara dois blocos de bytes sem deixar o tempo de resposta entregar nada. */
function bytesIguais(a: Uint8Array, b: Uint8Array): boolean {
  let diferenca = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    diferenca |= (a[i] ?? 0) ^ (b[i] ?? 0);
  }
  return diferenca === 0;
}

function daBase64(valor: string): Uint8Array {
  return Uint8Array.from(atob(valor), (c) => c.charCodeAt(0));
}

/**
 * Confere a senha recebida contra o hash guardado.
 *
 * Derivar a chave custa de proposito: mesmo quem tenha o hash em maos precisa
 * gastar esse trabalho todo a cada tentativa de adivinhacao.
 */
async function confereHash(recebida: string, guardado: string): Promise<boolean> {
  const [algoritmo, iteracoes, sal, esperado] = guardado.split("$");
  if (algoritmo !== "pbkdf2") return false;

  const chave = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(recebida),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: daBase64(sal), iterations: Number(iteracoes) },
    chave,
    256,
  );
  return bytesIguais(new Uint8Array(bits), daBase64(esperado));
}

/** Compara duas senhas em texto, tambem sem entregar nada pelo tempo. */
function senhaConfere(recebida: string, esperada: string): boolean {
  const codificar = new TextEncoder();
  return bytesIguais(codificar.encode(recebida), codificar.encode(esperada));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ erro: "Método não permitido." }, 405);

  const esperada = Deno.env.get("PAINEL_SENHA");
  if (!esperada && !SENHA_EMBUTIDA) {
    return json(
      { erro: "O painel ainda não tem senha. Configure o segredo PAINEL_SENHA na função." },
      503,
    );
  }

  const recebida = req.headers.get("x-senha") ?? "";
  const confere = esperada
    ? senhaConfere(recebida, esperada)
    : await confereHash(recebida, SENHA_EMBUTIDA);
  if (!confere) {
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
