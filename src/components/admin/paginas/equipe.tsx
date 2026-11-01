import { useState, type FormEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Loader2, Pencil, Plus, Users } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase";
import type { MembroEquipe } from "@/lib/cms/tipos";
import { apagarArquivos, caminhoDaUrl, traduzirErro } from "@/lib/cms/util";
import {
  BOTAO_PRIMARIO,
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

const CHAVE = ["admin", "equipe"];
type Rascunho = Omit<MembroEquipe, "id"> & { id?: string };
const VAZIO: Rascunho = { nome: "", cargo: "", bio: "", foto_url: null, ordem: 0, publicado: true };

export function PaginaEquipe() {
  const cliente = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: CHAVE,
    queryFn: async () => {
      const { data, error } = await supabase()
        .from("mc_equipe")
        .select("*")
        .order("ordem")
        .order("nome");
      if (error) throw error;
      return (data ?? []) as MembroEquipe[];
    },
  });
  const [editando, setEditando] = useState<Rascunho | null>(null);
  const [salvando, setSalvando] = useState(false);

  const invalidar = () => {
    void cliente.invalidateQueries({ queryKey: CHAVE });
    void cliente.invalidateQueries({ queryKey: ["publico"] });
  };

  const salvar = async (e: FormEvent) => {
    e.preventDefault();
    if (!editando) return;
    if (editando.nome.trim().length < 2) return toast.error("Informe o nome.");
    setSalvando(true);
    const { id, ...dados } = editando;
    const anterior = data?.find((m) => m.id === id);
    const { error } = id
      ? await supabase().from("mc_equipe").update(dados).eq("id", id)
      : await supabase()
          .from("mc_equipe")
          .insert({ ...dados, ordem: data?.length ?? 0 });
    setSalvando(false);
    if (error) return void toast.error(traduzirErro(error));
    if (anterior?.foto_url && anterior.foto_url !== dados.foto_url)
      await apagarArquivos([caminhoDaUrl(anterior.foto_url)]);
    toast.success(id ? "Dados atualizados." : "Pessoa adicionada à equipe.");
    setEditando(null);
    invalidar();
  };

  const excluir = async (m: MembroEquipe) => {
    const { error } = await supabase().from("mc_equipe").delete().eq("id", m.id);
    if (error) return void toast.error(traduzirErro(error));
    await apagarArquivos([caminhoDaUrl(m.foto_url)]);
    toast.success("Removida da equipe.");
    invalidar();
  };

  const mover = async (i: number, direcao: -1 | 1) => {
    const lista = [...(data ?? [])];
    const alvo = i + direcao;
    if (alvo < 0 || alvo >= lista.length) return;
    [lista[i], lista[alvo]] = [lista[alvo], lista[i]];
    const r = await Promise.all(
      lista.map((m, ordem) => supabase().from("mc_equipe").update({ ordem }).eq("id", m.id)),
    );
    const falha = r.find((x) => x.error)?.error;
    if (falha) toast.error(traduzirErro(falha));
    invalidar();
  };

  return (
    <>
      <CabecalhoPagina
        titulo="Equipe"
        descricao="Quem serve no Mulheres Curadas. A equipe publicada aparece na página Sobre."
        acoes={
          <button
            type="button"
            onClick={() => setEditando({ ...VAZIO })}
            className={BOTAO_PRIMARIO}
          >
            <Plus className="h-4 w-4" aria-hidden="true" /> Adicionar pessoa
          </button>
        }
      />
      {error ? (
        <ErroCarregar erro={error} />
      ) : isLoading ? (
        <Carregando />
      ) : !data?.length ? (
        <div className={CARTAO}>
          <EstadoVazio
            icone={<Users className="h-6 w-6" aria-hidden="true" />}
            titulo="Equipe ainda vazia"
            texto="Adicione as líderes e voluntárias com foto e uma frase sobre cada uma."
          />
        </div>
      ) : (
        <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {data.map((m, i) => (
            <li key={m.id} className={`${CARTAO} flex flex-col p-5`}>
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full bg-[color:var(--admin-rosado)]">
                  {m.foto_url ? (
                    <img
                      src={m.foto_url}
                      alt=""
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <span className="flex h-full items-center justify-center text-display text-2xl text-[color:var(--admin-vinho)]">
                      {m.nome[0]}
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-foreground/90">{m.nome}</p>
                  <p className="truncate text-sm text-foreground/55">{m.cargo || "—"}</p>
                </div>
                {!m.publicado && <Selo tom="cinza">Oculta</Selo>}
              </div>
              {m.bio && <p className="mt-3 line-clamp-3 text-sm text-foreground/65">{m.bio}</p>}
              <div className="mt-auto flex items-center justify-between pt-4">
                <div className="flex">
                  <button
                    type="button"
                    onClick={() => void mover(i, -1)}
                    disabled={i === 0}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full text-foreground/55 hover:bg-[color:var(--admin-fundo)] disabled:opacity-30"
                    aria-label="Mover para cima"
                  >
                    <ArrowUp className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => void mover(i, 1)}
                    disabled={i === data.length - 1}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full text-foreground/55 hover:bg-[color:var(--admin-fundo)] disabled:opacity-30"
                    aria-label="Mover para baixo"
                  >
                    <ArrowDown className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
                <div className="flex">
                  <button
                    type="button"
                    onClick={() => setEditando(m)}
                    className="inline-flex min-h-[40px] items-center gap-2 rounded-full px-4 text-sm font-semibold text-[color:var(--admin-vinho)] hover:bg-[color:var(--admin-fundo)]"
                  >
                    <Pencil className="h-4 w-4" aria-hidden="true" /> Editar
                  </button>
                  <BotaoExcluir
                    rotulo=""
                    titulo={`Remover ${m.nome}?`}
                    texto="A pessoa sai da página Sobre."
                    aoConfirmar={() => excluir(m)}
                  />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={editando !== null} onOpenChange={(v) => !v && setEditando(null)}>
        <DialogContent className="admin-raiz max-h-[90vh] overflow-y-auto rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-display text-3xl text-[color:var(--admin-vinho)]">
              {editando?.id ? "Editar pessoa" : "Adicionar pessoa"}
            </DialogTitle>
          </DialogHeader>
          {editando && (
            <form onSubmit={salvar} className="space-y-4">
              <div className="mx-auto w-40">
                <CampoImagem
                  rotulo="Foto"
                  valor={editando.foto_url}
                  aoMudar={(url) => setEditando({ ...editando, foto_url: url })}
                  pasta="equipe"
                  proporcao="aspect-square"
                />
              </div>
              <Campo rotulo="Nome">
                {(i) => (
                  <input
                    id={i}
                    className={CAMPO}
                    value={editando.nome}
                    onChange={(e) => setEditando({ ...editando, nome: e.target.value })}
                    required
                  />
                )}
              </Campo>
              <Campo rotulo="Função">
                {(i) => (
                  <input
                    id={i}
                    className={CAMPO}
                    value={editando.cargo}
                    onChange={(e) => setEditando({ ...editando, cargo: e.target.value })}
                    placeholder="Ex.: Líder de louvor"
                  />
                )}
              </Campo>
              <Campo rotulo="Sobre ela">
                {(i) => (
                  <textarea
                    id={i}
                    rows={3}
                    className={CAMPO}
                    value={editando.bio}
                    onChange={(e) => setEditando({ ...editando, bio: e.target.value })}
                  />
                )}
              </Campo>
              <Interruptor
                rotulo="Mostrar no site"
                marcado={editando.publicado}
                aoMudar={(v) => setEditando({ ...editando, publicado: v })}
              />
              <button type="submit" disabled={salvando} className={`${BOTAO_PRIMARIO} w-full`}>
                {salvando && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                Salvar
              </button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
