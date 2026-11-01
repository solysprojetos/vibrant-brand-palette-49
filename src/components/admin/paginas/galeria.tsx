import { useEffect, useRef, useState, type DragEvent, type FormEvent } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowLeftIcon,
  ArrowRightIcon,
  Images,
  Loader2,
  Plus,
  Star,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase";
import type { Album, Evento, Foto } from "@/lib/cms/tipos";
import {
  apagarArquivos,
  enviarImagem,
  formatarDia,
  medirImagem,
  slugUnico,
  traduzirErro,
} from "@/lib/cms/util";
import {
  BOTAO_PRIMARIO,
  BOTAO_SECUNDARIO,
  BotaoExcluir,
  CAMPO,
  CARTAO,
  CabecalhoPagina,
  Campo,
  Carregando,
  ConfirmarExclusao,
  ErroCarregar,
  EstadoVazio,
  Interruptor,
  Selo,
} from "../ui";

type AlbumComTotal = Album & { total: number };

function useAlbuns() {
  return useQuery({
    queryKey: ["admin", "albuns"],
    queryFn: async () => {
      const [albuns, fotos] = await Promise.all([
        supabase().from("mc_albuns").select("*").order("data", { ascending: false }),
        supabase().from("mc_fotos").select("album_id"),
      ]);
      if (albuns.error) throw albuns.error;
      const contagem = new Map<string, number>();
      for (const f of fotos.data ?? [])
        contagem.set(f.album_id, (contagem.get(f.album_id) ?? 0) + 1);
      return ((albuns.data ?? []) as Album[]).map((a) => ({
        ...a,
        total: contagem.get(a.id) ?? 0,
      })) as AlbumComTotal[];
    },
  });
}

function useEventosSimples() {
  return useQuery({
    queryKey: ["admin", "eventos", "simples"],
    queryFn: async () => {
      const { data, error } = await supabase()
        .from("mc_eventos")
        .select("id, titulo, inicio")
        .order("inicio", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Pick<Evento, "id" | "titulo" | "inicio">[];
    },
  });
}

function useInvalidar() {
  const cliente = useQueryClient();
  return () => {
    void cliente.invalidateQueries({ queryKey: ["admin", "albuns"] });
    void cliente.invalidateQueries({ queryKey: ["admin", "fotos"] });
    void cliente.invalidateQueries({ queryKey: ["admin", "dashboard"] });
    void cliente.invalidateQueries({ queryKey: ["publico"] });
  };
}

export function PaginaGaleria({ album }: { album?: string }) {
  if (album) return <EditorAlbum id={album} />;
  return <ListaAlbuns />;
}

function ListaAlbuns() {
  const { data: albuns, isLoading, error } = useAlbuns();
  const [criando, setCriando] = useState(false);

  return (
    <>
      <CabecalhoPagina
        titulo="Galeria de fotos"
        descricao="Organize as fotos em álbuns por evento. Os álbuns publicados aparecem na galeria do site (botão “Galeria de fotos” abaixo dos Momentos). As imagens são guardadas na qualidade original."
        acoes={
          <button type="button" onClick={() => setCriando(true)} className={BOTAO_PRIMARIO}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Novo álbum
          </button>
        }
      />
      {error ? (
        <ErroCarregar erro={error} />
      ) : isLoading ? (
        <Carregando />
      ) : !albuns?.length ? (
        <div className={CARTAO}>
          <EstadoVazio
            icone={<Images className="h-6 w-6" aria-hidden="true" />}
            titulo="Nenhum álbum ainda"
            texto="Crie um álbum para o último encontro e envie as fotos de uma vez."
            acao={
              <button type="button" onClick={() => setCriando(true)} className={BOTAO_PRIMARIO}>
                <Plus className="h-4 w-4" aria-hidden="true" /> Novo álbum
              </button>
            }
          />
        </div>
      ) : (
        <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {albuns.map((a) => (
            <li key={a.id}>
              <Link
                to="/admin/galeria"
                search={{ album: a.id }}
                className={`${CARTAO} group block overflow-hidden transition hover:-translate-y-0.5`}
              >
                <div className="aspect-[4/3] overflow-hidden bg-[color:var(--admin-rosado)]">
                  {a.capa_url ? (
                    <img
                      src={a.capa_url}
                      alt=""
                      loading="lazy"
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-[color:var(--admin-vinho)]/40">
                      <Images className="h-10 w-10" aria-hidden="true" />
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="truncate text-lg font-semibold text-foreground/90">{a.titulo}</p>
                    <Selo tom={a.publicado ? "verde" : "cinza"}>
                      {a.publicado ? "Publicado" : "Rascunho"}
                    </Selo>
                  </div>
                  <p className="mt-1 text-sm text-foreground/55">
                    {formatarDia(a.data)} · {a.total} {a.total === 1 ? "foto" : "fotos"}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <NovoAlbum aberto={criando} aoFechar={() => setCriando(false)} />
    </>
  );
}

function NovoAlbum({ aberto, aoFechar }: { aberto: boolean; aoFechar: () => void }) {
  const navegar = useNavigate();
  const invalidar = useInvalidar();
  const { data: eventos } = useEventosSimples();
  const [titulo, setTitulo] = useState("");
  const [data, setData] = useState(() => new Date().toISOString().slice(0, 10));
  const [eventoId, setEventoId] = useState("");
  const [salvando, setSalvando] = useState(false);

  const criar = async (e: FormEvent) => {
    e.preventDefault();
    if (titulo.trim().length < 2) return toast.error("Dê um título ao álbum.");
    setSalvando(true);
    const { data: criado, error } = await supabase()
      .from("mc_albuns")
      .insert({ titulo: titulo.trim(), slug: slugUnico(titulo), data, evento_id: eventoId || null })
      .select("id")
      .single();
    setSalvando(false);
    if (error) return void toast.error(traduzirErro(error));
    toast.success("Álbum criado. Agora é só enviar as fotos.");
    invalidar();
    aoFechar();
    setTitulo("");
    void navegar({ to: "/admin/galeria", search: { album: criado.id } });
  };

  return (
    <Dialog open={aberto} onOpenChange={(v) => !v && aoFechar()}>
      <DialogContent className="admin-raiz rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-display text-3xl text-[color:var(--admin-vinho)]">
            Novo álbum
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={criar} className="space-y-4">
          <Campo rotulo="Título">
            {(i) => (
              <input
                id={i}
                className={CAMPO}
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ex.: Encontro de novembro"
                autoFocus
              />
            )}
          </Campo>
          <Campo rotulo="Data">
            {(i) => (
              <input
                id={i}
                type="date"
                className={CAMPO}
                value={data}
                onChange={(e) => setData(e.target.value)}
                required
              />
            )}
          </Campo>
          <Campo rotulo="Evento (opcional)">
            {(i) => (
              <select
                id={i}
                className={CAMPO}
                value={eventoId}
                onChange={(e) => setEventoId(e.target.value)}
              >
                <option value="">Sem evento</option>
                {(eventos ?? []).map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.titulo}
                  </option>
                ))}
              </select>
            )}
          </Campo>
          <button type="submit" disabled={salvando} className={`${BOTAO_PRIMARIO} w-full`}>
            {salvando && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            Criar álbum
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditorAlbum({ id }: { id: string }) {
  const navegar = useNavigate();
  const invalidar = useInvalidar();
  const { data: albuns, isLoading } = useAlbuns();
  const { data: eventos } = useEventosSimples();
  const album = albuns?.find((a) => a.id === id);
  const [form, setForm] = useState<Album | null>(null);
  const [salvando, setSalvando] = useState(false);

  const fotosQ = useQuery({
    queryKey: ["admin", "fotos", id],
    queryFn: async () => {
      const { data, error } = await supabase()
        .from("mc_fotos")
        .select("*")
        .eq("album_id", id)
        .order("ordem")
        .order("criado_em");
      if (error) throw error;
      return (data ?? []) as Foto[];
    },
  });
  const [fotos, setFotos] = useState<Foto[]>([]);
  useEffect(() => setFotos(fotosQ.data ?? []), [fotosQ.data]);
  useEffect(() => {
    if (album) setForm(album);
  }, [album]);

  if (isLoading) return <Carregando />;
  if (!album || !form) {
    return (
      <EstadoVazio
        icone={<Images className="h-6 w-6" aria-hidden="true" />}
        titulo="Álbum não encontrado"
        acao={
          <Link to="/admin/galeria" className={BOTAO_SECUNDARIO}>
            Voltar para a galeria
          </Link>
        }
      />
    );
  }

  const salvar = async (e?: FormEvent) => {
    e?.preventDefault();
    if (form.titulo.trim().length < 2) return toast.error("Dê um título ao álbum.");
    setSalvando(true);
    const { error } = await supabase()
      .from("mc_albuns")
      .update({
        titulo: form.titulo.trim(),
        descricao: form.descricao,
        data: form.data,
        evento_id: form.evento_id || null,
        publicado: form.publicado,
        capa_url: form.capa_url,
      })
      .eq("id", id);
    setSalvando(false);
    if (error) return void toast.error(traduzirErro(error));
    toast.success("Álbum salvo.");
    invalidar();
  };

  const definirCapa = async (url: string) => {
    setForm({ ...form, capa_url: url });
    const { error } = await supabase().from("mc_albuns").update({ capa_url: url }).eq("id", id);
    if (error) return void toast.error(traduzirErro(error));
    toast.success("Foto de capa definida.");
    invalidar();
  };

  const excluirAlbum = async () => {
    const caminhos = fotos.map((f) => f.caminho);
    const { error } = await supabase().from("mc_albuns").delete().eq("id", id);
    if (error) return void toast.error(traduzirErro(error));
    await apagarArquivos(caminhos);
    toast.success("Álbum excluído.");
    invalidar();
    void navegar({ to: "/admin/galeria" });
  };

  return (
    <>
      <Link
        to="/admin/galeria"
        className="mb-4 inline-flex min-h-[40px] items-center gap-2 text-sm font-semibold text-[color:var(--admin-vinho)]/80 hover:text-[color:var(--admin-vinho)]"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Galeria
      </Link>
      <CabecalhoPagina
        titulo={form.titulo || "Álbum"}
        descricao={`${fotos.length} ${fotos.length === 1 ? "foto" : "fotos"} · ${form.publicado ? "visível no site" : "rascunho, só no painel"}`}
        acoes={
          <>
            <BotaoExcluir
              rotulo="Excluir álbum"
              titulo="Excluir o álbum inteiro?"
              texto="O álbum e todas as fotos dele serão apagados de vez."
              aoConfirmar={excluirAlbum}
            />
            <button
              type="button"
              onClick={() => void salvar()}
              disabled={salvando}
              className={BOTAO_PRIMARIO}
            >
              {salvando && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              Salvar álbum
            </button>
          </>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="order-2 space-y-6 xl:order-1">
          <EnvioDeFotos
            albumId={id}
            proximaOrdem={(fotos.at(-1)?.ordem ?? -1) + 1}
            temCapa={Boolean(form.capa_url)}
            aoDefinirCapa={definirCapa}
          />
          <GradeDeFotos
            fotos={fotos}
            setFotos={setFotos}
            capa={form.capa_url}
            aoDefinirCapa={definirCapa}
          />
        </div>

        <form onSubmit={salvar} className={`${CARTAO} order-1 h-fit space-y-4 p-6 xl:order-2`}>
          <h2 className="text-display text-2xl text-[color:var(--admin-vinho)]">Detalhes</h2>
          <Campo rotulo="Título">
            {(i) => (
              <input
                id={i}
                className={CAMPO}
                value={form.titulo}
                onChange={(e) => setForm({ ...form, titulo: e.target.value })}
              />
            )}
          </Campo>
          <Campo rotulo="Descrição">
            {(i) => (
              <textarea
                id={i}
                rows={3}
                className={CAMPO}
                value={form.descricao}
                onChange={(e) => setForm({ ...form, descricao: e.target.value })}
              />
            )}
          </Campo>
          <Campo rotulo="Data">
            {(i) => (
              <input
                id={i}
                type="date"
                className={CAMPO}
                value={form.data}
                onChange={(e) => setForm({ ...form, data: e.target.value })}
              />
            )}
          </Campo>
          <Campo rotulo="Evento">
            {(i) => (
              <select
                id={i}
                className={CAMPO}
                value={form.evento_id ?? ""}
                onChange={(e) => setForm({ ...form, evento_id: e.target.value || null })}
              >
                <option value="">Sem evento</option>
                {(eventos ?? []).map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.titulo}
                  </option>
                ))}
              </select>
            )}
          </Campo>
          <Interruptor
            rotulo="Publicado no site"
            marcado={form.publicado}
            aoMudar={(v) => setForm({ ...form, publicado: v })}
          />
          <button type="submit" disabled={salvando} className={`${BOTAO_SECUNDARIO} w-full`}>
            Salvar detalhes
          </button>
        </form>
      </div>
    </>
  );
}

function EnvioDeFotos({
  albumId,
  proximaOrdem,
  temCapa,
  aoDefinirCapa,
}: {
  albumId: string;
  proximaOrdem: number;
  temCapa: boolean;
  aoDefinirCapa: (url: string) => void;
}) {
  const invalidar = useInvalidar();
  const entrada = useRef<HTMLInputElement>(null);
  const [progresso, setProgresso] = useState<{ feitos: number; total: number } | null>(null);
  const [arrastando, setArrastando] = useState(false);

  const enviar = async (lista: FileList | File[] | null) => {
    const arquivos = Array.from(lista ?? []).filter((a) => a.type.startsWith("image/"));
    if (!arquivos.length) return;
    setProgresso({ feitos: 0, total: arquivos.length });
    let ordem = proximaOrdem;
    let primeira: string | null = null;
    const falhas: string[] = [];

    // Tres envios ao mesmo tempo: rapido sem sufocar a internet do celular.
    const fila = [...arquivos];
    const trabalhador = async () => {
      while (fila.length) {
        const arquivo = fila.shift()!;
        const minhaOrdem = ordem++;
        try {
          const [medida, enviado] = await Promise.all([
            medirImagem(arquivo),
            enviarImagem(arquivo, `albuns/${albumId}`),
          ]);
          const { error } = await supabase()
            .from("mc_fotos")
            .insert({
              album_id: albumId,
              url: enviado.url,
              caminho: enviado.caminho,
              largura: medida?.largura ?? null,
              altura: medida?.altura ?? null,
              ordem: minhaOrdem,
              legenda: "",
            });
          if (error) {
            await apagarArquivos([enviado.caminho]);
            throw error;
          }
          if (!primeira) primeira = enviado.url;
        } catch (erro) {
          falhas.push(`${arquivo.name}: ${traduzirErro(erro)}`);
        } finally {
          setProgresso((p) => (p ? { ...p, feitos: p.feitos + 1 } : p));
        }
      }
    };
    await Promise.all([trabalhador(), trabalhador(), trabalhador()]);

    if (!temCapa && primeira) aoDefinirCapa(primeira);
    const enviados = arquivos.length - falhas.length;
    if (enviados)
      toast.success(`${enviados} ${enviados === 1 ? "foto enviada" : "fotos enviadas"}.`);
    if (falhas.length) toast.error(falhas.slice(0, 3).join("\n"));
    setProgresso(null);
    if (entrada.current) entrada.current.value = "";
    invalidar();
  };

  const soltar = (e: DragEvent) => {
    e.preventDefault();
    setArrastando(false);
    void enviar(e.dataTransfer.files);
  };

  return (
    <div
      onDragOver={(e) => {
        if (e.dataTransfer.types.includes("Files")) {
          e.preventDefault();
          setArrastando(true);
        }
      }}
      onDragLeave={() => setArrastando(false)}
      onDrop={soltar}
      className={`${CARTAO} flex flex-col items-center border-2 border-dashed px-6 py-10 text-center transition ${
        arrastando
          ? "border-[color:var(--admin-vinho)] bg-[color:var(--admin-rosado)]/60"
          : "border-[color:var(--admin-linha)]"
      }`}
    >
      {progresso ? (
        <div className="w-full max-w-sm" role="status">
          <Loader2
            className="mx-auto h-8 w-8 animate-spin text-[color:var(--admin-vinho)]"
            aria-hidden="true"
          />
          <p className="mt-3 text-sm font-semibold text-foreground/80">
            Enviando {progresso.feitos} de {progresso.total}…
          </p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-[color:var(--admin-rosado)]">
            <div
              className="h-full rounded-full bg-[color:var(--admin-vinho)] transition-all"
              style={{ width: `${(progresso.feitos / progresso.total) * 100}%` }}
            />
          </div>
        </div>
      ) : (
        <>
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[color:var(--admin-rosado)] text-[color:var(--admin-vinho)]">
            <UploadCloud className="h-6 w-6" aria-hidden="true" />
          </span>
          <p className="mt-4 text-display text-2xl text-[color:var(--admin-vinho)]">
            Arraste as fotos para cá
          </p>
          <p className="mt-1 text-sm text-foreground/60">
            ou escolha várias de uma vez — JPG, PNG, WebP ou HEIC, até 25 MB cada.
          </p>
          <button
            type="button"
            onClick={() => entrada.current?.click()}
            className={`${BOTAO_PRIMARIO} mt-5`}
          >
            Escolher fotos
          </button>
        </>
      )}
      <input
        ref={entrada}
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => void enviar(e.target.files)}
      />
    </div>
  );
}

function GradeDeFotos({
  fotos,
  setFotos,
  capa,
  aoDefinirCapa,
}: {
  fotos: Foto[];
  setFotos: (f: Foto[]) => void;
  capa: string | null;
  aoDefinirCapa: (url: string) => void;
}) {
  const invalidar = useInvalidar();
  const [arrastada, setArrastada] = useState<number | null>(null);

  const salvarOrdem = async (lista: Foto[]) => {
    setFotos(lista.map((f, i) => ({ ...f, ordem: i })));
    const resultados = await Promise.all(
      lista.map((f, i) =>
        f.ordem === i ? null : supabase().from("mc_fotos").update({ ordem: i }).eq("id", f.id),
      ),
    );
    const erro = resultados.find((r) => r?.error)?.error;
    if (erro) toast.error(traduzirErro(erro));
    else toast.success("Ordem salva.");
    invalidar();
  };

  const mover = (de: number, para: number) => {
    if (para < 0 || para >= fotos.length || de === para) return;
    const lista = [...fotos];
    const [item] = lista.splice(de, 1);
    lista.splice(para, 0, item);
    void salvarOrdem(lista);
  };

  const salvarLegenda = async (foto: Foto, legenda: string) => {
    if (legenda === foto.legenda) return;
    const { error } = await supabase().from("mc_fotos").update({ legenda }).eq("id", foto.id);
    if (error) return void toast.error(traduzirErro(error));
    setFotos(fotos.map((f) => (f.id === foto.id ? { ...f, legenda } : f)));
    toast.success("Legenda salva.");
  };

  const excluir = async (foto: Foto) => {
    const { error } = await supabase().from("mc_fotos").delete().eq("id", foto.id);
    if (error) return void toast.error(traduzirErro(error));
    await apagarArquivos([foto.caminho]);
    setFotos(fotos.filter((f) => f.id !== foto.id));
    toast.success("Foto excluída.");
    invalidar();
  };

  if (!fotos.length) return null;

  return (
    <section>
      <p className="mb-3 text-sm text-foreground/55">
        Arraste as fotos (ou use as setas) para mudar a ordem. A estrela define a capa do álbum.
      </p>
      <ul className="grid grid-cols-2 gap-4 md:grid-cols-3">
        {fotos.map((foto, i) => (
          <li
            key={foto.id}
            draggable
            onDragStart={() => setArrastada(i)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (arrastada !== null) mover(arrastada, i);
              setArrastada(null);
            }}
            className={`${CARTAO} overflow-hidden transition ${arrastada === i ? "opacity-50" : ""}`}
          >
            <div className="relative aspect-square cursor-grab bg-[color:var(--admin-fundo)] active:cursor-grabbing">
              <img
                src={foto.url}
                alt={foto.legenda}
                loading="lazy"
                className="h-full w-full object-cover"
                draggable={false}
              />
              <span className="absolute top-2 left-2 rounded-full bg-black/45 px-2 py-0.5 text-xs font-semibold text-white">
                {i + 1}
              </span>
              <button
                type="button"
                onClick={() => aoDefinirCapa(foto.url)}
                className={`absolute top-2 right-2 inline-flex h-9 w-9 items-center justify-center rounded-full shadow transition ${
                  capa === foto.url
                    ? "bg-[color:var(--admin-dourado)] text-white"
                    : "bg-white/90 text-foreground/60 hover:text-[color:var(--admin-dourado)]"
                }`}
                aria-label={capa === foto.url ? "Esta é a capa do álbum" : "Definir como capa"}
                aria-pressed={capa === foto.url}
                title={capa === foto.url ? "Capa do álbum" : "Definir como capa"}
              >
                <Star
                  className="h-4 w-4"
                  fill={capa === foto.url ? "currentColor" : "none"}
                  aria-hidden="true"
                />
              </button>
            </div>
            <div className="space-y-2 p-3">
              <input
                aria-label={`Legenda da foto ${i + 1}`}
                defaultValue={foto.legenda}
                onBlur={(e) => void salvarLegenda(foto, e.target.value.trim())}
                onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
                placeholder="Escreva uma legenda…"
                className="w-full rounded-lg border border-transparent bg-transparent px-2 py-1.5 text-sm outline-none transition hover:border-[color:var(--admin-linha)] focus:border-primary/40 focus:bg-white"
              />
              <div className="flex items-center justify-between">
                <div className="flex">
                  <button
                    type="button"
                    onClick={() => mover(i, i - 1)}
                    disabled={i === 0}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full text-foreground/60 hover:bg-[color:var(--admin-fundo)] disabled:opacity-30"
                    aria-label="Mover para antes"
                  >
                    <ArrowLeftIcon className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => mover(i, i + 1)}
                    disabled={i === fotos.length - 1}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full text-foreground/60 hover:bg-[color:var(--admin-fundo)] disabled:opacity-30"
                    aria-label="Mover para depois"
                  >
                    <ArrowRightIcon className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
                <ConfirmarExclusao
                  titulo="Excluir esta foto?"
                  texto="A foto sai do álbum e do site de vez."
                  aoConfirmar={() => excluir(foto)}
                >
                  <button
                    type="button"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full text-destructive hover:bg-destructive/10"
                    aria-label="Excluir foto"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </ConfirmarExclusao>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
