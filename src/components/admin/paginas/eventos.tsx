import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  CalendarHeart,
  CheckCircle2,
  Eye,
  EyeOff,
  GripVertical,
  Loader2,
  MapPin,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import type { Evento, ItemProgramacao } from "@/lib/cms/tipos";
import {
  ROTULO_SITUACAO,
  apagarArquivos,
  caminhoDaUrl,
  deCampoDataHora,
  formatarData,
  formatarHora,
  paraCampoDataHora,
  situacaoDoEvento,
  slugUnico,
  traduzirErro,
  type SituacaoEvento,
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

const CHAVE = ["admin", "eventos"];

function useEventos() {
  return useQuery({
    queryKey: CHAVE,
    queryFn: async () => {
      const { data, error } = await supabase()
        .from("mc_eventos")
        .select("*")
        .order("inicio", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Evento[];
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

const ABAS: { chave: SituacaoEvento | "todos"; rotulo: string }[] = [
  { chave: "todos", rotulo: "Todos" },
  { chave: "proximo", rotulo: "Próximos" },
  { chave: "andamento", rotulo: "Em andamento" },
  { chave: "realizado", rotulo: "Realizados" },
];

export function PaginaEventos({ id }: { id?: string }) {
  if (id) return <EditorEvento id={id} />;
  return <ListaEventos />;
}

function ListaEventos() {
  const { data: eventos, isLoading, error } = useEventos();
  const [aba, setAba] = useState<SituacaoEvento | "todos">("todos");
  const invalidar = useInvalidar();

  const alternar = useMutation({
    mutationFn: async ({
      id,
      campo,
      valor,
    }: {
      id: string;
      campo: "publicado" | "realizado";
      valor: boolean;
    }) => {
      const { error } = await supabase()
        .from("mc_eventos")
        .update({ [campo]: valor })
        .eq("id", id);
      if (error) throw error;
      return { campo, valor };
    },
    onSuccess: ({ campo, valor }) => {
      toast.success(
        campo === "publicado"
          ? valor
            ? "Evento publicado no site."
            : "Evento tirado do site."
          : valor
            ? "Evento marcado como realizado."
            : "Marca de realizado removida.",
      );
      invalidar();
    },
    onError: (e) => toast.error(traduzirErro(e)),
  });

  const filtrados = useMemo(
    () => (eventos ?? []).filter((e) => aba === "todos" || situacaoDoEvento(e) === aba),
    [eventos, aba],
  );

  return (
    <>
      <CabecalhoPagina
        titulo="Eventos"
        descricao="Cadastre encontros, publique no site e marque como realizados quando acontecerem."
        acoes={
          <Link to="/admin/eventos" search={{ id: "novo" }} className={BOTAO_PRIMARIO}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Novo evento
          </Link>
        }
      />

      <div className="mb-6 flex gap-2 overflow-x-auto pb-1" role="tablist">
        {ABAS.map((a) => {
          const total = (eventos ?? []).filter(
            (e) => a.chave === "todos" || situacaoDoEvento(e) === a.chave,
          ).length;
          return (
            <button
              key={a.chave}
              type="button"
              role="tab"
              aria-selected={aba === a.chave}
              onClick={() => setAba(a.chave)}
              className={`inline-flex min-h-[40px] shrink-0 items-center gap-2 rounded-full px-5 text-sm font-semibold transition ${
                aba === a.chave
                  ? "bg-[color:var(--admin-vinho)] text-white"
                  : "bg-white text-foreground/70 ring-1 ring-[color:var(--admin-linha)] hover:text-foreground"
              }`}
            >
              {a.rotulo}
              <span
                className={`text-xs ${aba === a.chave ? "text-white/70" : "text-foreground/40"}`}
              >
                {total}
              </span>
            </button>
          );
        })}
      </div>

      {error ? (
        <ErroCarregar erro={error} />
      ) : isLoading ? (
        <Carregando />
      ) : filtrados.length === 0 ? (
        <div className={CARTAO}>
          <EstadoVazio
            icone={<CalendarHeart className="h-6 w-6" aria-hidden="true" />}
            titulo="Nenhum evento por aqui"
            texto="Cadastre o próximo encontro com data, local, programação e link de inscrição."
            acao={
              <Link to="/admin/eventos" search={{ id: "novo" }} className={BOTAO_PRIMARIO}>
                <Plus className="h-4 w-4" aria-hidden="true" />
                Novo evento
              </Link>
            }
          />
        </div>
      ) : (
        <ul className="grid gap-4">
          {filtrados.map((e) => {
            const situacao = situacaoDoEvento(e);
            return (
              <li
                key={e.id}
                className={`${CARTAO} flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:p-5`}
              >
                <Link
                  to="/admin/eventos"
                  search={{ id: e.id }}
                  className="flex min-w-0 flex-1 items-center gap-4"
                >
                  <div className="h-20 w-28 shrink-0 overflow-hidden rounded-2xl bg-[color:var(--admin-rosado)]">
                    {e.banner_url ? (
                      <img
                        src={e.banner_url}
                        alt=""
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-[color:var(--admin-vinho)]/50">
                        <CalendarHeart className="h-6 w-6" aria-hidden="true" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Selo
                        tom={
                          situacao === "proximo"
                            ? "rosa"
                            : situacao === "andamento"
                              ? "dourado"
                              : "cinza"
                        }
                      >
                        {ROTULO_SITUACAO[situacao]}
                      </Selo>
                      <Selo tom={e.publicado ? "verde" : "cinza"}>
                        {e.publicado ? "Publicado" : "Rascunho"}
                      </Selo>
                    </div>
                    <p className="mt-2 truncate text-lg font-semibold text-foreground/90">
                      {e.titulo}
                    </p>
                    <p className="text-sm text-foreground/60">
                      {formatarData(e.inicio)} · {formatarHora(e.inicio)}
                      {e.local && ` · ${e.local}`}
                    </p>
                  </div>
                </Link>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      alternar.mutate({ id: e.id, campo: "publicado", valor: !e.publicado })
                    }
                    className="inline-flex min-h-[40px] items-center gap-2 rounded-full px-4 text-sm font-semibold text-[color:var(--admin-vinho)] ring-1 ring-[color:var(--admin-linha)] transition hover:bg-[color:var(--admin-fundo)]"
                  >
                    {e.publicado ? (
                      <EyeOff className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <Eye className="h-4 w-4" aria-hidden="true" />
                    )}
                    {e.publicado ? "Despublicar" : "Publicar"}
                  </button>
                  {!e.realizado && (
                    <button
                      type="button"
                      onClick={() => alternar.mutate({ id: e.id, campo: "realizado", valor: true })}
                      className="inline-flex min-h-[40px] items-center gap-2 rounded-full px-4 text-sm font-semibold text-foreground/70 ring-1 ring-[color:var(--admin-linha)] transition hover:bg-[color:var(--admin-fundo)]"
                    >
                      <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                      Marcar realizado
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

type Rascunho = Omit<Evento, "id" | "criado_em" | "atualizado_em" | "slug" | "inicio" | "fim"> & {
  inicio: string;
  fim: string;
};

const VAZIO: Rascunho = {
  titulo: "",
  resumo: "",
  descricao: "",
  banner_url: null,
  inicio: "",
  fim: "",
  local: "",
  endereco: "",
  mapa_url: "",
  programacao: [],
  informacoes: "",
  investimento: "",
  link_inscricao: "",
  whatsapp: "",
  publicado: false,
  realizado: false,
};

function EditorEvento({ id }: { id: string }) {
  const novo = id === "novo";
  const navegar = useNavigate();
  const invalidar = useInvalidar();
  const { data: eventos, isLoading } = useEventos();
  const original = novo ? undefined : eventos?.find((e) => e.id === id);
  const [form, setForm] = useState<Rascunho>(VAZIO);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (original) {
      setForm({
        ...original,
        inicio: paraCampoDataHora(original.inicio),
        fim: paraCampoDataHora(original.fim),
        programacao: Array.isArray(original.programacao) ? original.programacao : [],
      });
    }
  }, [original]);

  if (!novo && isLoading) return <Carregando />;
  if (!novo && !original) {
    return (
      <EstadoVazio
        icone={<CalendarHeart className="h-6 w-6" aria-hidden="true" />}
        titulo="Evento não encontrado"
        acao={
          <Link to="/admin/eventos" className={BOTAO_SECUNDARIO}>
            Voltar para eventos
          </Link>
        }
      />
    );
  }

  const muda = <K extends keyof Rascunho>(campo: K, valor: Rascunho[K]) =>
    setForm((f) => ({ ...f, [campo]: valor }));

  const mudaItem = (i: number, campo: keyof ItemProgramacao, valor: string) =>
    muda(
      "programacao",
      form.programacao.map((item, j) => (j === i ? { ...item, [campo]: valor } : item)),
    );

  const moverItem = (i: number, direcao: -1 | 1) => {
    const lista = [...form.programacao];
    const alvo = i + direcao;
    if (alvo < 0 || alvo >= lista.length) return;
    [lista[i], lista[alvo]] = [lista[alvo], lista[i]];
    muda("programacao", lista);
  };

  const salvar = async (e: FormEvent) => {
    e.preventDefault();
    if (form.titulo.trim().length < 3) return toast.error("Dê um nome ao evento.");
    if (!form.inicio) return toast.error("Informe a data e o horário de início.");
    if (form.fim && form.fim < form.inicio)
      return toast.error("O fim não pode ser antes do início.");
    for (const link of [form.link_inscricao, form.mapa_url]) {
      if (link.trim() && !/^https?:\/\//i.test(link.trim())) {
        return toast.error("Links precisam começar com https://");
      }
    }

    setSalvando(true);
    const dados = {
      ...form,
      titulo: form.titulo.trim(),
      inicio: deCampoDataHora(form.inicio),
      fim: deCampoDataHora(form.fim),
      programacao: form.programacao.filter((p) => p.titulo.trim() || p.hora.trim()),
    };
    try {
      if (novo) {
        const { data, error } = await supabase()
          .from("mc_eventos")
          .insert({ ...dados, slug: slugUnico(dados.titulo) })
          .select("id")
          .single();
        if (error) throw error;
        toast.success(
          dados.publicado ? "Evento criado e publicado." : "Evento salvo como rascunho.",
        );
        invalidar();
        void navegar({ to: "/admin/eventos", search: { id: data.id }, replace: true });
      } else {
        const { error } = await supabase().from("mc_eventos").update(dados).eq("id", id);
        if (error) throw error;
        // Banner trocado: o arquivo antigo sai do Storage.
        if (original?.banner_url && original.banner_url !== form.banner_url) {
          await apagarArquivos([caminhoDaUrl(original.banner_url)]);
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
    const { error } = await supabase().from("mc_eventos").delete().eq("id", id);
    if (error) return void toast.error(traduzirErro(error));
    await apagarArquivos([caminhoDaUrl(original?.banner_url)]);
    toast.success("Evento excluído.");
    invalidar();
    void navegar({ to: "/admin/eventos" });
  };

  return (
    <form onSubmit={salvar}>
      <Link
        to="/admin/eventos"
        className="mb-4 inline-flex min-h-[40px] items-center gap-2 text-sm font-semibold text-[color:var(--admin-vinho)]/80 hover:text-[color:var(--admin-vinho)]"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Eventos
      </Link>
      <CabecalhoPagina
        titulo={novo ? "Novo evento" : form.titulo || "Editar evento"}
        acoes={
          <>
            {!novo && (
              <BotaoExcluir
                titulo="Excluir este evento?"
                texto="O evento sai do site e do painel. Os álbuns ligados a ele continuam existindo."
                aoConfirmar={excluir}
              />
            )}
            <button type="submit" disabled={salvando} className={BOTAO_PRIMARIO}>
              {salvando && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              {novo ? "Criar evento" : "Salvar alterações"}
            </button>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <section className={`${CARTAO} space-y-5 p-6 md:p-8`}>
            <h2 className="text-display text-2xl text-[color:var(--admin-vinho)]">Informações</h2>
            <Campo rotulo="Nome do evento">
              {(i) => (
                <input
                  id={i}
                  className={CAMPO}
                  value={form.titulo}
                  onChange={(e) => muda("titulo", e.target.value)}
                  placeholder="Ex.: Encontro Mulheres Curadas — Novembro"
                  required
                />
              )}
            </Campo>
            <Campo rotulo="Resumo" dica="Uma ou duas frases que aparecem no cartão do evento.">
              {(i) => (
                <textarea
                  id={i}
                  rows={2}
                  className={CAMPO}
                  value={form.resumo}
                  onChange={(e) => muda("resumo", e.target.value)}
                />
              )}
            </Campo>
            <Campo rotulo="Descrição completa" dica="Separe os parágrafos com uma linha em branco.">
              {(i) => (
                <textarea
                  id={i}
                  rows={7}
                  className={CAMPO}
                  value={form.descricao}
                  onChange={(e) => muda("descricao", e.target.value)}
                />
              )}
            </Campo>
            <div className="grid gap-5 sm:grid-cols-2">
              <Campo rotulo="Início (data e horário)">
                {(i) => (
                  <input
                    id={i}
                    type="datetime-local"
                    className={CAMPO}
                    value={form.inicio}
                    onChange={(e) => muda("inicio", e.target.value)}
                    required
                  />
                )}
              </Campo>
              <Campo rotulo="Término (opcional)">
                {(i) => (
                  <input
                    id={i}
                    type="datetime-local"
                    className={CAMPO}
                    value={form.fim}
                    onChange={(e) => muda("fim", e.target.value)}
                  />
                )}
              </Campo>
            </div>
          </section>

          <section className={`${CARTAO} space-y-5 p-6 md:p-8`}>
            <h2 className="flex items-center gap-2 text-display text-2xl text-[color:var(--admin-vinho)]">
              <MapPin className="h-5 w-5" aria-hidden="true" /> Local
            </h2>
            <div className="grid gap-5 sm:grid-cols-2">
              <Campo rotulo="Nome do lugar">
                {(i) => (
                  <input
                    id={i}
                    className={CAMPO}
                    value={form.local}
                    onChange={(e) => muda("local", e.target.value)}
                    placeholder="Ex.: CC Visão Profética"
                  />
                )}
              </Campo>
              <Campo rotulo="Investimento">
                {(i) => (
                  <input
                    id={i}
                    className={CAMPO}
                    value={form.investimento}
                    onChange={(e) => muda("investimento", e.target.value)}
                    placeholder="Gratuito, R$ 50,00…"
                  />
                )}
              </Campo>
            </div>
            <Campo rotulo="Endereço completo">
              {(i) => (
                <input
                  id={i}
                  className={CAMPO}
                  value={form.endereco}
                  onChange={(e) => muda("endereco", e.target.value)}
                />
              )}
            </Campo>
            <Campo
              rotulo="Link do mapa (opcional)"
              dica="Se ficar vazio, o site monta o link do Google Maps pelo endereço."
            >
              {(i) => (
                <input
                  id={i}
                  type="url"
                  className={CAMPO}
                  value={form.mapa_url}
                  onChange={(e) => muda("mapa_url", e.target.value)}
                  placeholder="https://maps.app.goo.gl/…"
                />
              )}
            </Campo>
          </section>

          <section className={`${CARTAO} space-y-4 p-6 md:p-8`}>
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-display text-2xl text-[color:var(--admin-vinho)]">Programação</h2>
              <button
                type="button"
                onClick={() => muda("programacao", [...form.programacao, { hora: "", titulo: "" }])}
                className={BOTAO_SECUNDARIO}
              >
                <Plus className="h-4 w-4" aria-hidden="true" /> Item
              </button>
            </div>
            {form.programacao.length === 0 && (
              <p className="text-sm text-foreground/55">
                Adicione os momentos do encontro: recepção, louvor, palavra…
              </p>
            )}
            <ol className="space-y-3">
              {form.programacao.map((item, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 rounded-2xl bg-[color:var(--admin-fundo)] p-3"
                >
                  <div className="flex flex-col pt-1">
                    <button
                      type="button"
                      onClick={() => moverItem(i, -1)}
                      className="rounded p-1 text-foreground/40 hover:text-foreground"
                      aria-label="Subir item"
                    >
                      ▲
                    </button>
                    <GripVertical
                      className="mx-auto h-4 w-4 text-foreground/25"
                      aria-hidden="true"
                    />
                    <button
                      type="button"
                      onClick={() => moverItem(i, 1)}
                      className="rounded p-1 text-foreground/40 hover:text-foreground"
                      aria-label="Descer item"
                    >
                      ▼
                    </button>
                  </div>
                  <div className="grid flex-1 gap-2 sm:grid-cols-[110px_minmax(0,1fr)]">
                    <input
                      aria-label="Horário"
                      className={CAMPO}
                      value={item.hora}
                      onChange={(e) => mudaItem(i, "hora", e.target.value)}
                      placeholder="18h30"
                    />
                    <input
                      aria-label="Atividade"
                      className={CAMPO}
                      value={item.titulo}
                      onChange={(e) => mudaItem(i, "titulo", e.target.value)}
                      placeholder="Louvor e adoração"
                    />
                    <input
                      aria-label="Detalhe"
                      className={`${CAMPO} sm:col-span-2`}
                      value={item.descricao ?? ""}
                      onChange={(e) => mudaItem(i, "descricao", e.target.value)}
                      placeholder="Detalhe (opcional): com quem, onde…"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      muda(
                        "programacao",
                        form.programacao.filter((_, j) => j !== i),
                      )
                    }
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full text-destructive hover:bg-destructive/10"
                    aria-label="Remover item"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ol>
          </section>

          <section className={`${CARTAO} space-y-5 p-6 md:p-8`}>
            <h2 className="text-display text-2xl text-[color:var(--admin-vinho)]">
              Informações adicionais
            </h2>
            <Campo rotulo="O que levar, avisos, observações">
              {(i) => (
                <textarea
                  id={i}
                  rows={4}
                  className={CAMPO}
                  value={form.informacoes}
                  onChange={(e) => muda("informacoes", e.target.value)}
                  placeholder="Ex.: Leve 2 kg de alimento."
                />
              )}
            </Campo>
          </section>
        </div>

        <div className="space-y-6">
          <section className={`${CARTAO} space-y-4 p-6`}>
            <h2 className="text-display text-2xl text-[color:var(--admin-vinho)]">Publicação</h2>
            <Interruptor
              rotulo="Publicado no site"
              descricao="Desligado, o evento fica só no painel."
              marcado={form.publicado}
              aoMudar={(v) => muda("publicado", v)}
            />
            <Interruptor
              rotulo="Evento realizado"
              descricao="Move o evento para “Realizados”, mesmo antes da data acabar."
              marcado={form.realizado}
              aoMudar={(v) => muda("realizado", v)}
            />
          </section>

          <section className={`${CARTAO} p-6`}>
            <CampoImagem
              rotulo="Banner ou imagem principal"
              valor={form.banner_url}
              aoMudar={(url) => muda("banner_url", url)}
              pasta="eventos"
              proporcao="aspect-[4/5]"
              dica="Formato retrato (4:5) ou quadrado fica melhor. A imagem vai na qualidade original."
            />
          </section>

          <section className={`${CARTAO} space-y-5 p-6`}>
            <h2 className="text-display text-2xl text-[color:var(--admin-vinho)]">
              Inscrição e contato
            </h2>
            <Campo
              rotulo="Link de inscrição"
              dica="Formulário, Sympla, página do site… Ex.: https://www.mulherescuradas.com/inscricao/"
            >
              {(i) => (
                <input
                  id={i}
                  type="url"
                  className={CAMPO}
                  value={form.link_inscricao}
                  onChange={(e) => muda("link_inscricao", e.target.value)}
                  placeholder="https://"
                />
              )}
            </Campo>
            <Campo rotulo="WhatsApp para dúvidas" dica="Só os números com DDD, ou um link wa.me.">
              {(i) => (
                <input
                  id={i}
                  className={CAMPO}
                  value={form.whatsapp}
                  onChange={(e) => muda("whatsapp", e.target.value)}
                  placeholder="(85) 90000-0000"
                />
              )}
            </Campo>
          </section>
        </div>
      </div>
    </form>
  );
}
