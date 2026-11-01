import { useState, type FormEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { KeyRound, Loader2, ShieldCheck, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SUPABASE_URL, supabase } from "@/lib/supabase";
import { formatarDataHora } from "@/lib/cms/util";
import { useSessao } from "../sessao";
import {
  BOTAO_PRIMARIO,
  BotaoExcluir,
  CAMPO,
  CARTAO,
  CabecalhoPagina,
  Campo,
  Carregando,
  ErroCarregar,
  EstadoVazio,
  Selo,
} from "../ui";

type Usuario = {
  user_id: string;
  nome: string;
  email: string;
  papel: "admin" | "editor";
  criado_em: string;
  ultimo_acesso: string | null;
};

/** Chama a funcao admin-usuarios com o token de quem esta logada. */
async function chamar<T = { ok: true }>(corpo: Record<string, unknown>): Promise<T> {
  const { data } = await supabase().auth.getSession();
  let resposta: Response;
  try {
    resposta = await fetch(`${SUPABASE_URL}/functions/v1/admin-usuarios`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${data.session?.access_token ?? ""}`,
      },
      body: JSON.stringify(corpo),
    });
  } catch {
    throw new Error(
      "Não foi possível falar com a função admin-usuarios. Confira se ela foi publicada no Supabase (veja o manual).",
    );
  }
  const json = await resposta.json().catch(() => ({}));
  if (!resposta.ok) {
    if (resposta.status === 404)
      throw new Error(
        "A função admin-usuarios ainda não foi publicada no Supabase (veja o manual).",
      );
    throw new Error(json.erro ?? `Erro ${resposta.status}`);
  }
  return json as T;
}

export function PaginaUsuarios() {
  const { acesso } = useSessao();
  const cliente = useQueryClient();
  const [criando, setCriando] = useState(false);
  const [trocandoSenha, setTrocandoSenha] = useState<Usuario | null>(null);
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "usuarios"],
    enabled: acesso?.papel === "admin",
    queryFn: () => chamar<{ usuarios: Usuario[] }>({ acao: "listar" }).then((r) => r.usuarios),
  });
  const invalidar = () => void cliente.invalidateQueries({ queryKey: ["admin", "usuarios"] });

  if (acesso?.papel !== "admin") {
    return (
      <EstadoVazio
        icone={<ShieldCheck className="h-6 w-6" aria-hidden="true" />}
        titulo="Somente administradoras"
        texto="Peça a uma administradora para gerenciar os acessos."
      />
    );
  }

  const executar = async (corpo: Record<string, unknown>, sucesso: string) => {
    try {
      await chamar(corpo);
      toast.success(sucesso);
      invalidar();
      return true;
    } catch (erro) {
      toast.error(erro instanceof Error ? erro.message : "Não foi possível concluir.");
      return false;
    }
  };

  return (
    <>
      <CabecalhoPagina
        titulo="Usuários e acesso"
        descricao="Quem pode entrar no painel. Administradoras gerenciam tudo; editoras cuidam do conteúdo, sem mexer em acessos."
        acoes={
          <button type="button" onClick={() => setCriando(true)} className={BOTAO_PRIMARIO}>
            <UserPlus className="h-4 w-4" aria-hidden="true" /> Novo acesso
          </button>
        }
      />
      {error ? (
        <ErroCarregar erro={error} />
      ) : isLoading ? (
        <Carregando />
      ) : (
        <ul className={`${CARTAO} divide-y divide-[color:var(--admin-linha)]`}>
          {(data ?? []).map((u) => (
            <li
              key={u.user_id}
              className="flex flex-col gap-3 px-5 py-4 md:flex-row md:items-center"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[color:var(--admin-rosado)] font-semibold text-[color:var(--admin-vinho)]">
                {(u.nome || u.email)[0]?.toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-foreground/90">
                  {u.nome || "—"}{" "}
                  {u.user_id === acesso.user_id && (
                    <span className="text-xs font-normal text-foreground/50">(você)</span>
                  )}
                </p>
                <p className="truncate text-sm text-foreground/55">
                  {u.email} ·{" "}
                  {u.ultimo_acesso
                    ? `último acesso ${formatarDataHora(u.ultimo_acesso)}`
                    : "nunca entrou"}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <label className="sr-only" htmlFor={`papel-${u.user_id}`}>
                  Papel
                </label>
                <select
                  id={`papel-${u.user_id}`}
                  value={u.papel}
                  disabled={u.user_id === acesso.user_id}
                  onChange={(e) =>
                    void executar(
                      { acao: "papel", user_id: u.user_id, papel: e.target.value },
                      "Papel atualizado.",
                    )
                  }
                  className={`${CAMPO} w-auto rounded-full py-2`}
                >
                  <option value="admin">Administradora</option>
                  <option value="editor">Editora</option>
                </select>
                {u.papel === "admin" && <Selo tom="rosa">Admin</Selo>}
                <button
                  type="button"
                  onClick={() => setTrocandoSenha(u)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full text-foreground/60 hover:bg-[color:var(--admin-fundo)]"
                  aria-label={`Definir nova senha para ${u.email}`}
                  title="Definir nova senha"
                >
                  <KeyRound className="h-4 w-4" aria-hidden="true" />
                </button>
                {u.user_id !== acesso.user_id && (
                  <BotaoExcluir
                    rotulo="Remover"
                    titulo={`Remover o acesso de ${u.nome || u.email}?`}
                    texto="A pessoa deixa de entrar no painel. O login dela continua existindo e pode receber acesso de novo depois."
                    aoConfirmar={() =>
                      void executar({ acao: "remover", user_id: u.user_id }, "Acesso removido.")
                    }
                  />
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <NovoAcesso
        aberto={criando}
        aoFechar={() => setCriando(false)}
        aoCriar={(corpo) =>
          executar(
            { acao: "criar", ...corpo },
            "Acesso criado. Envie o e-mail e a senha para a pessoa.",
          )
        }
      />
      <TrocarSenha
        usuario={trocandoSenha}
        aoFechar={() => setTrocandoSenha(null)}
        aoSalvar={(senha) =>
          executar({ acao: "senha", user_id: trocandoSenha?.user_id, senha }, "Senha definida.")
        }
      />
    </>
  );
}

function gerarSenha(): string {
  const alfabeto = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  return Array.from(
    crypto.getRandomValues(new Uint32Array(12)),
    (n) => alfabeto[n % alfabeto.length],
  ).join("");
}

function NovoAcesso({
  aberto,
  aoFechar,
  aoCriar,
}: {
  aberto: boolean;
  aoFechar: () => void;
  aoCriar: (c: Record<string, string>) => Promise<boolean>;
}) {
  const [form, setForm] = useState({ nome: "", email: "", senha: gerarSenha(), papel: "editor" });
  const [salvando, setSalvando] = useState(false);

  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    setSalvando(true);
    const ok = await aoCriar(form);
    setSalvando(false);
    if (ok) {
      setForm({ nome: "", email: "", senha: gerarSenha(), papel: "editor" });
      aoFechar();
    }
  };

  return (
    <Dialog open={aberto} onOpenChange={(v) => !v && aoFechar()}>
      <DialogContent className="admin-raiz rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-display text-3xl text-[color:var(--admin-vinho)]">
            Novo acesso
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={enviar} className="space-y-4">
          <Campo rotulo="Nome">
            {(i) => (
              <input
                id={i}
                className={CAMPO}
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                required
              />
            )}
          </Campo>
          <Campo rotulo="E-mail">
            {(i) => (
              <input
                id={i}
                type="email"
                className={CAMPO}
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            )}
          </Campo>
          <Campo
            rotulo="Senha inicial"
            dica="Gerada automaticamente. A pessoa pode trocar depois em “Minha conta”."
          >
            {(i) => (
              <input
                id={i}
                className={`${CAMPO} font-mono`}
                value={form.senha}
                onChange={(e) => setForm({ ...form, senha: e.target.value })}
                minLength={8}
                required
              />
            )}
          </Campo>
          <Campo rotulo="Papel">
            {(i) => (
              <select
                id={i}
                className={CAMPO}
                value={form.papel}
                onChange={(e) => setForm({ ...form, papel: e.target.value })}
              >
                <option value="editor">Editora — cuida do conteúdo</option>
                <option value="admin">Administradora — tudo, inclusive acessos</option>
              </select>
            )}
          </Campo>
          <button type="submit" disabled={salvando} className={`${BOTAO_PRIMARIO} w-full`}>
            {salvando && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            Criar acesso
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function TrocarSenha({
  usuario,
  aoFechar,
  aoSalvar,
}: {
  usuario: Usuario | null;
  aoFechar: () => void;
  aoSalvar: (senha: string) => Promise<boolean>;
}) {
  const [senha, setSenha] = useState(gerarSenha);
  const [salvando, setSalvando] = useState(false);
  return (
    <Dialog open={usuario !== null} onOpenChange={(v) => !v && aoFechar()}>
      <DialogContent className="admin-raiz rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-display text-3xl text-[color:var(--admin-vinho)]">
            Nova senha
          </DialogTitle>
        </DialogHeader>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setSalvando(true);
            const ok = await aoSalvar(senha);
            setSalvando(false);
            if (ok) {
              setSenha(gerarSenha());
              aoFechar();
            }
          }}
          className="space-y-4"
        >
          <p className="text-sm text-foreground/65">
            Defina uma nova senha para {usuario?.email} e envie para a pessoa.
          </p>
          <Campo rotulo="Senha">
            {(i) => (
              <input
                id={i}
                className={`${CAMPO} font-mono`}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                minLength={8}
                required
              />
            )}
          </Campo>
          <button type="submit" disabled={salvando} className={`${BOTAO_PRIMARIO} w-full`}>
            {salvando && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            Salvar senha
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
