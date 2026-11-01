import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2, MessageSquareHeart, Plus, Search, Star } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { TIPOS_PUBLICACAO, type Publicacao, type TipoPublicacao } from "@/lib/cms/tipos";
import {
  apagarArquivos,
  caminhoDaUrl,
  formatarDataHora,
  slugUnico,
  traduzirErro,
  videoIncorporado,
} from "@/lib/cms/util";
import {
  BOTAO_PRIMARIO,
  BOTAO_SECUNDARIO,
  BotaoExcluir,
  CAMPO,
  CARTAO,
  CabecalhoPagina,
  Campo,
  CampoImagem,
  Carregando,
  ErroCarregar,
  EstadoVazio,
  Interruptor,
  Selo,
} from "../ui";

const CHAVE = ["admin", "publicacoes"];

function usePublicacoes() {
  return useQuery({
    queryKey: CHAVE,
    queryFn: async () => {
      const { data, error } = await supabase()
        .from("mc_publicacoes")
        .select("*")
        .order("publicado_em", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Publicacao[];
    },
  });
}

function useInvalidar() {
  const cliente = useQueryClient();
  return () => {
    void cliente.invalidateQueries({ queryKey: CHAVE });
    void cliente.invalidateQueries({ queryKey: ["admin", "dashboard"] });
    void cliente.invalidateQueries({ queryKey: ["publico"] });
  };
}

export function PaginaMensagens({ id }: { id?: string }) {
  if (id) return <EditorPublicacao id={id} />;
  return <ListaPublicacoes />;
}

function ListaPublicacoes() {
  const { data, isLoading, error } = usePublicacoes();
  const [tipo, setTipo] = useState<TipoPublicacao | "todos">("todos");
  const [busca, setBusca] = useState("");

  const lista = useMemo(() => {
    const termo = busca.trim().toLocaleLowerCase("pt-BR");
    return (data ?? []).filter(
      (p) =>
        (tipo === "todos" || p.tipo === tipo) &&
        (!termo ||
          `${p.titulo} ${p.autora} ${p.resumo}`.toLocaleLowerCase("pt-BR").includes(termo)),
    );
  }, [data, tipo, busca]);

  return (
    <>
      <CabecalhoPagina
        titulo="Mensagens e testemunhos"
        descricao="Testemunhos, histórias de transformação, mensagens de fé, reflexões e vídeos especiais. Fica guardado no painel. O site atual ainda não mostra esta seção — ela entra no ar quando vocês decidirem publicar."
        acoes={
          <Link to="/admin/mensagens" search={{ id: "novo" }} className={BOTAO_PRIMARIO}>
            <Plus className="h-4 w-4" aria-hidden="true" /> Nova publicação
          </Link>
        }
      />
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {(["todos", ...Object.keys(TIPOS_PUBLICACAO)] as (TipoPublicacao | "todos")[]).map(
            (t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTipo(t)}
                aria-pressed={tipo === t}
                className={`inline-flex min-h-[40px] shrink-0 items-center rounded-full px-4 text-sm font-semibold transition ${
                  tipo === t
                    ? "bg-[color:var(--admin-vinho)] text-white"
                    : "bg-white text-foreground/70 ring-1 ring-[color:var(--admin-linha)]"
                }`}
              >
                {t === "todos" ? "Todos" : TIPOS_PUBLICACAO[t].plural}
              </button>
            ),
          )}
        </div>
        <label className="relative md:ml-auto md:w-64">
          <span className="sr-only">Buscar</span>
          <Search
            className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-foreground/40"
            aria-hidden="true"
          />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar…"
            className={`${CAMPO} rounded-full pl-10`}
          />
        </label>
      </div>

      {error ? (
        <ErroCarregar erro={error} />
      ) : isLoading ? (
        <Carregando />
      ) : !lista.length ? (
        <div className={CARTAO}>
          <EstadoVazio
            icone={<MessageSquareHeart className="h-6 w-6" aria-hidden="true" />}
            titulo="Nada por aqui ainda"
            texto="Cadastre o primeiro testemunho, mensagem ou vídeo."
            acao={
              <Link to="/admin/mensagens" search={{ id: "novo" }} className={BOTAO_PRIMARIO}>
                <Plus className="h-4 w-4" aria-hidden="true" /> Nova publicação
              </Link>
            }
          />
        </div>
      ) : (
        <ul className={`${CARTAO} divide-y divide-[color:var(--admin-linha)] px-2`}>
          {lista.map((p) => (
            <li key={p.id}>
              <Link
                to="/admin/mensagens"
                search={{ id: p.id }}
                className="flex items-center gap-4 rounded-2xl px-4 py-4 transition hover:bg-[color:var(--admin-fundo)]"
              >
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-[color:var(--admin-rosado)]">
                  {p.imagem_url ? (
                    <img
                      src={p.imagem_url}
                      alt=""
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-[color:var(--admin-vinho)]/50">
                      <MessageSquareHeart className="h-5 w-5" aria-hidden="true" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 truncate text-[17px] font-semibold text-foreground/90">
                    {p.destaque && (
                      <Star
                        className="h-4 w-4 shrink-0 text-[color:var(--admin-dourado)]"
                        fill="currentColor"
                        aria-label="Destaque"
                      />
                    )}
                    <span className="truncate">{p.titulo}</span>
                  </p>
                  <p className="truncate text-xs text-foreground/55">
                    {TIPOS_PUBLICACAO[p.tipo].rotulo}
                    {p.autora && ` · ${p.autora}`} · {formatarDataHora(p.atualizado_em)}
                  </p>
                </div>
                <Selo tom={p.publicado ? "verde" : "cinza"}>
                  {p.publicado ? "Publicado" : "Rascunho"}
                </Selo>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

type Rascunho = Omit<Publicacao, "id" | "slug" | "criado_em" | "atualizado_em">;

const VAZIO: Rascunho = {
  tipo: "testemunho",
  titulo: "",
  autora: "",
  contexto: "",
  resumo: "",
  conteudo: "",
  imagem_url: null,
  video_url: "",
  destaque: false,
  publicado: true,
  publicado_em: new Date().toISOString(),
};

function EditorPublicacao({ id }: { id: string }) {
  const novo = id === "novo";
  const navegar = useNavigate();
  const invalidar = useInvalidar();
  const { data, isLoading } = usePublicacoes();
  const original = novo ? undefined : data?.find((p) => p.id === id);
  const [form, setForm] = useState<Rascunho>(VAZIO);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (original) setForm(original);
  }, [original]);

  if (!novo && isLoading) return <Carregando />;
  if (!novo && !original) {
    return (
      <EstadoVazio
        icone={<MessageSquareHeart className="h-6 w-6" aria-hidden="true" />}
        titulo="Publicação não encontrada"
        acao={
          <Link to="/admin/mensagens" className={BOTAO_SECUNDARIO}>
            Voltar
          </Link>
        }
      />
    );
  }

  const muda = <K extends keyof Rascunho>(campo: K, valor: Rascunho[K]) =>
    setForm((f) => ({ ...f, [campo]: valor }));
  const videoValido = !form.video_url.trim() || Boolean(videoIncorporado(form.video_url));

  const salvar = async (e: FormEvent) => {
    e.preventDefault();
    if (form.titulo.trim().length < 3) return toast.error("Dê um título à publicação.");
    if (form.tipo === "video" && !form.video_url.trim())
      return toast.error("Cole o link do vídeo (YouTube ou Vimeo).");
    if (!videoValido) return toast.error("Use um link do YouTube ou do Vimeo.");
    if (!form.conteudo.trim() && !form.video_url.trim())
      return toast.error("Escreva o texto da publicação.");

    setSalvando(true);
    const dados = { ...form, titulo: form.titulo.trim() };
    try {
      if (novo) {
        const { data: criado, error } = await supabase()
          .from("mc_publicacoes")
          .insert({
            ...dados,
            slug: slugUnico(dados.titulo),
            publicado_em: new Date().toISOString(),
          })
          .select("id")
          .single();
        if (error) throw error;
        toast.success(dados.publicado ? "Publicado no site." : "Salvo como rascunho.");
        invalidar();
        void navegar({ to: "/admin/mensagens", search: { id: criado.id }, replace: true });
      } else {
        const { error } = await supabase().from("mc_publicacoes").update(dados).eq("id", id);
        if (error) throw error;
        if (original?.imagem_url && original.imagem_url !== form.imagem_url) {
          await apagarArquivos([caminhoDaUrl(original.imagem_url)]);
        }
        toast.success("Alterações salvas.");
        invalidar();
      }
    } catch (erro) {
      toast.error(traduzirErro(erro));
    } finally {
      setSalvando(false);
    }
  };

  const excluir = async () => {
    const { error } = await supabase().from("mc_publicacoes").delete().eq("id", id);
    if (error) return void toast.error(traduzirErro(error));
    await apagarArquivos([caminhoDaUrl(original?.imagem_url)]);
    toast.success("Publicação excluída.");
    invalidar();
    void navegar({ to: "/admin/mensagens" });
  };

  const incorporado = videoIncorporado(form.video_url);

  return (
    <form onSubmit={salvar}>
      <Link
        to="/admin/mensagens"
        className="mb-4 inline-flex min-h-[40px] items-center gap-2 text-sm font-semibold text-[color:var(--admin-vinho)]/80 hover:text-[color:var(--admin-vinho)]"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Mensagens e testemunhos
      </Link>
      <CabecalhoPagina
        titulo={novo ? "Nova publicação" : form.titulo || "Editar publicação"}
        acoes={
          <>
            {!novo && (
              <BotaoExcluir
                titulo="Excluir esta publicação?"
                texto="Ela sai do site e do painel de vez."
                aoConfirmar={excluir}
              />
            )}
            <button type="submit" disabled={salvando} className={BOTAO_PRIMARIO}>
              {salvando && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              {novo ? "Publicar" : "Salvar alterações"}
            </button>
          </>
        }
      />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <section className={`${CARTAO} space-y-5 p-6 md:p-8`}>
          <Campo rotulo="Tipo">
            {(i) => (
              <select
                id={i}
                className={CAMPO}
                value={form.tipo}
                onChange={(e) => muda("tipo", e.target.value as TipoPublicacao)}
              >
                {Object.entries(TIPOS_PUBLICACAO).map(([chave, t]) => (
                  <option key={chave} value={chave}>
                    {t.rotulo}
                  </option>
                ))}
              </select>
            )}
          </Campo>
          <Campo rotulo="Título">
            {(i) => (
              <input
                id={i}
                className={CAMPO}
                value={form.titulo}
                onChange={(e) => muda("titulo", e.target.value)}
                placeholder="Ex.: Deus restaurou minha família"
                required
              />
            )}
          </Campo>
          <div className="grid gap-5 sm:grid-cols-2">
            <Campo rotulo="Autora" dica="Peça autorização antes de publicar o nome.">
              {(i) => (
                <input
                  id={i}
                  className={CAMPO}
                  value={form.autora}
                  onChange={(e) => muda("autora", e.target.value)}
                />
              )}
            </Campo>
            <Campo rotulo="Contexto" dica='Ex.: "Participante do 2º encontro".'>
              {(i) => (
                <input
                  id={i}
                  className={CAMPO}
                  value={form.contexto}
                  onChange={(e) => muda("contexto", e.target.value)}
                />
              )}
            </Campo>
          </div>
          <Campo rotulo="Resumo" dica="Versão curta, para cartões e depoimentos.">
            {(i) => (
              <textarea
                id={i}
                rows={3}
                maxLength={400}
                className={CAMPO}
                value={form.resumo}
                onChange={(e) => muda("resumo", e.target.value)}
              />
            )}
          </Campo>
          <Campo rotulo="Texto completo" dica="Separe os parágrafos com uma linha em branco.">
            {(i) => (
              <textarea
                id={i}
                rows={12}
                className={CAMPO}
                value={form.conteudo}
                onChange={(e) => muda("conteudo", e.target.value)}
              />
            )}
          </Campo>
          <Campo rotulo="Vídeo (opcional)" dica="Link do YouTube ou do Vimeo.">
            {(i) => (
              <input
                id={i}
                type="url"
                className={`${CAMPO} ${videoValido ? "" : "border-destructive"}`}
                value={form.video_url}
                onChange={(e) => muda("video_url", e.target.value)}
                placeholder="https://www.youtube.com/watch?v=…"
              />
            )}
          </Campo>
          {incorporado && (
            <div className="aspect-video overflow-hidden rounded-2xl bg-black">
              <iframe
                src={incorporado}
                title="Prévia do vídeo"
                className="h-full w-full"
                allowFullScreen
                loading="lazy"
              />
            </div>
          )}
        </section>
        <div className="space-y-6">
          <section className={`${CARTAO} space-y-4 p-6`}>
            <h2 className="text-display text-2xl text-[color:var(--admin-vinho)]">Publicação</h2>
            <Interruptor
              rotulo="Publicado no site"
              marcado={form.publicado}
              aoMudar={(v) => muda("publicado", v)}
            />
            <Interruptor
              rotulo="Destaque"
              descricao="Separa os melhores para os depoimentos (até 3)."
              marcado={form.destaque}
              aoMudar={(v) => muda("destaque", v)}
            />
          </section>
          <section className={`${CARTAO} p-6`}>
            <CampoImagem
              rotulo="Imagem (opcional)"
              valor={form.imagem_url}
              aoMudar={(url) => muda("imagem_url", url)}
              pasta="publicacoes"
              proporcao="aspect-[4/3]"
            />
          </section>
        </div>
      </div>
    </form>
  );
}
