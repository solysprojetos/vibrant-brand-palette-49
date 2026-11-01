/**
 * Usuarios do painel /admin: listar, criar, mudar papel, trocar senha e remover.
 *
 * Criar login de outra pessoa exige a chave service_role, que nunca pode ir
 * para o navegador. Por isso essa parte vive aqui: a funcao confere o login de
 * quem chamou (token do Supabase Auth) e so atende administradoras
 * (papel = 'admin' em public.mc_equipe_acesso).
 */
import { createClient } from "jsr:@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(corpo: unknown, status = 200): Response {
  return new Response(JSON.stringify(corpo), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

const PAPEIS = new Set(["admin", "editor"]);

function emailValido(valor: unknown): valor is string {
  return typeof valor === "string" && /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(valor.trim());
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ erro: "Método não permitido." }, 405);

  const token = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!token) return json({ erro: "Faça login para continuar." }, 401);

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  const { data: quem, error: erroQuem } = await admin.auth.getUser(token);
  if (erroQuem || !quem.user) return json({ erro: "Sessão expirada. Entre de novo." }, 401);

  const { data: acesso } = await admin
    .from("mc_equipe_acesso")
    .select("papel")
    .eq("user_id", quem.user.id)
    .maybeSingle();
  if (acesso?.papel !== "admin") {
    return json({ erro: "Somente administradoras podem gerenciar usuários." }, 403);
  }

  try {
    const corpo = await req.json().catch(() => ({}));
    const acao = corpo.acao ?? "listar";

    if (acao === "listar") {
      const { data, error } = await admin
        .from("mc_equipe_acesso")
        .select("user_id, nome, email, papel, criado_em")
        .order("criado_em");
      if (error) throw error;

      // Ultimo acesso vem do Auth, nao da tabela.
      const { data: lista } = await admin.auth.admin.listUsers({ perPage: 1000 });
      const ultimo = new Map(
        (lista?.users ?? []).map((u) => [u.id, u.last_sign_in_at ?? null] as const),
      );
      return json({
        ok: true,
        usuarios: (data ?? []).map((u) => ({ ...u, ultimo_acesso: ultimo.get(u.user_id) ?? null })),
      });
    }

    if (acao === "criar") {
      const nome = String(corpo.nome ?? "").trim();
      const email = String(corpo.email ?? "")
        .trim()
        .toLowerCase();
      const senha = String(corpo.senha ?? "");
      const papel = String(corpo.papel ?? "editor");
      if (nome.length < 2) return json({ erro: "Informe o nome." }, 400);
      if (!emailValido(email)) return json({ erro: "E-mail inválido." }, 400);
      if (senha.length < 8)
        return json({ erro: "A senha precisa de pelo menos 8 caracteres." }, 400);
      if (!PAPEIS.has(papel)) return json({ erro: "Papel inválido." }, 400);

      let userId: string | undefined;
      const { data: criado, error } = await admin.auth.admin.createUser({
        email,
        password: senha,
        email_confirm: true,
        user_metadata: { nome },
      });
      if (error) {
        // Ja existe login com esse e-mail: so da o acesso ao painel.
        const { data: lista } = await admin.auth.admin.listUsers({ perPage: 1000 });
        userId = lista?.users.find((u) => u.email?.toLowerCase() === email)?.id;
        if (!userId) throw error;
      } else {
        userId = criado.user.id;
      }

      const { error: erroAcesso } = await admin
        .from("mc_equipe_acesso")
        .upsert({ user_id: userId, nome, email, papel });
      if (erroAcesso) throw erroAcesso;
      return json({ ok: true });
    }

    const userId = String(corpo.user_id ?? "");
    if (!userId) return json({ erro: "Usuário não informado." }, 400);

    if (acao === "papel") {
      const papel = String(corpo.papel ?? "");
      if (!PAPEIS.has(papel)) return json({ erro: "Papel inválido." }, 400);
      if (userId === quem.user.id && papel !== "admin") {
        return json({ erro: "Você não pode tirar o seu próprio acesso de administradora." }, 400);
      }
      const { error } = await admin
        .from("mc_equipe_acesso")
        .update({ papel })
        .eq("user_id", userId);
      if (error) throw error;
      return json({ ok: true });
    }

    if (acao === "senha") {
      const senha = String(corpo.senha ?? "");
      if (senha.length < 8)
        return json({ erro: "A senha precisa de pelo menos 8 caracteres." }, 400);
      const { error } = await admin.auth.admin.updateUserById(userId, { password: senha });
      if (error) throw error;
      return json({ ok: true });
    }

    if (acao === "remover") {
      if (userId === quem.user.id) {
        return json({ erro: "Você não pode remover o seu próprio acesso." }, 400);
      }
      // Tira so o acesso ao painel; o login continua existindo no Auth.
      const { error } = await admin.from("mc_equipe_acesso").delete().eq("user_id", userId);
      if (error) throw error;
      return json({ ok: true });
    }

    return json({ erro: "Ação desconhecida." }, 400);
  } catch (erro) {
    console.error(erro);
    return json({ erro: "Não foi possível concluir. Tente de novo." }, 500);
  }
});
