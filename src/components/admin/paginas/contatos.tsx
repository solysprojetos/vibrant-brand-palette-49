import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Inbox, Mail, MailOpen, MessageCircle, Phone } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import type { Contato } from "@/lib/cms/tipos";
import { formatarDataHora, linkWhatsapp, traduzirErro } from "@/lib/cms/util";
import {
  BotaoExcluir,
  CARTAO,
  CabecalhoPagina,
  Carregando,
  ErroCarregar,
  EstadoVazio,
  Selo,
} from "../ui";

export function PaginaContatos() {
  const cliente = useQueryClient();
  const [filtro, setFiltro] = useState<"todos" | "nao-lidos">("todos");
  const [aberto, setAberto] = useState<string | null>(null);
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "contatos"],
    queryFn: async () => {
      const { data, error } = await supabase()
        .from("mc_contatos")
        .select("*")
        .order("criado_em", { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data ?? []) as Contato[];
    },
  });

  const invalidar = () => {
    void cliente.invalidateQueries({ queryKey: ["admin", "contatos"] });
    void cliente.invalidateQueries({ queryKey: ["admin", "dashboard"] });
  };

  const marcar = async (c: Contato, lido: boolean, silencioso = false) => {
    const { error } = await supabase().from("mc_contatos").update({ lido }).eq("id", c.id);
    if (error) return void toast.error(traduzirErro(error));
    if (!silencioso) toast.success(lido ? "Marcada como lida." : "Marcada como não lida.");
    invalidar();
  };

  const excluir = async (c: Contato) => {
    const { error } = await supabase().from("mc_contatos").delete().eq("id", c.id);
    if (error) return void toast.error(traduzirErro(error));
    toast.success("Mensagem excluída.");
    invalidar();
  };

  const lista = (data ?? []).filter((c) => filtro === "todos" || !c.lido);
  const naoLidos = (data ?? []).filter((c) => !c.lido).length;

  return (
    <>
      <CabecalhoPagina
        titulo="Contatos recebidos"
        descricao="Mensagens enviadas pelo formulário da página de contato."
      />
      <div className="mb-6 flex gap-2">
        {(
          [
            ["todos", `Todas (${data?.length ?? 0})`],
            ["nao-lidos", `Não lidas (${naoLidos})`],
          ] as const
        ).map(([chave, rotulo]) => (
          <button
            key={chave}
            type="button"
            onClick={() => setFiltro(chave)}
            aria-pressed={filtro === chave}
            className={`inline-flex min-h-[40px] items-center rounded-full px-5 text-sm font-semibold transition ${
              filtro === chave
                ? "bg-[color:var(--admin-vinho)] text-white"
                : "bg-white text-foreground/70 ring-1 ring-[color:var(--admin-linha)]"
            }`}
          >
            {rotulo}
          </button>
        ))}
      </div>
      {error ? (
        <ErroCarregar erro={error} />
      ) : isLoading ? (
        <Carregando />
      ) : !lista.length ? (
        <div className={CARTAO}>
          <EstadoVazio
            icone={<Inbox className="h-6 w-6" aria-hidden="true" />}
            titulo="Caixa em dia"
            texto="Nenhuma mensagem por aqui."
          />
        </div>
      ) : (
        <ul className="space-y-3">
          {lista.map((c) => {
            const expandido = aberto === c.id;
            return (
              <li
                key={c.id}
                className={`${CARTAO} overflow-hidden ${c.lido ? "" : "ring-2 ring-[color:var(--admin-dourado)]/40"}`}
              >
                <button
                  type="button"
                  onClick={() => {
                    setAberto(expandido ? null : c.id);
                    if (!c.lido && !expandido) void marcar(c, true, true);
                  }}
                  aria-expanded={expandido}
                  className="flex w-full items-center gap-4 px-5 py-4 text-left transition hover:bg-[color:var(--admin-fundo)]"
                >
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${c.lido ? "bg-stone-100 text-stone-500" : "bg-[color:var(--admin-rosado)] text-[color:var(--admin-vinho)]"}`}
                  >
                    {c.lido ? (
                      <MailOpen className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <Mail className="h-4 w-4" aria-hidden="true" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span
                      className={`block truncate ${c.lido ? "text-foreground/80" : "font-semibold text-foreground"}`}
                    >
                      {c.nome}{" "}
                      {c.assunto && (
                        <span className="font-normal text-foreground/55">— {c.assunto}</span>
                      )}
                    </span>
                    <span className="block truncate text-sm text-foreground/55">{c.mensagem}</span>
                  </span>
                  <span className="hidden shrink-0 text-xs text-foreground/50 sm:block">
                    {formatarDataHora(c.criado_em)}
                  </span>
                  {!c.lido && <Selo tom="dourado">Nova</Selo>}
                </button>
                {expandido && (
                  <div className="border-t border-[color:var(--admin-linha)] px-5 py-5">
                    <p className="whitespace-pre-line text-[15px] leading-relaxed text-foreground/85">
                      {c.mensagem}
                    </p>
                    <div className="mt-5 flex flex-wrap items-center gap-2">
                      <a
                        href={`mailto:${c.email}?subject=${encodeURIComponent(`Re: ${c.assunto || "Mulheres Curadas"}`)}`}
                        className="inline-flex min-h-[40px] items-center gap-2 rounded-full bg-[color:var(--admin-vinho)] px-4 text-sm font-semibold text-white"
                      >
                        <Mail className="h-4 w-4" aria-hidden="true" /> {c.email}
                      </a>
                      {c.telefone && (
                        <>
                          <a
                            href={linkWhatsapp(
                              c.telefone,
                              `Olá, ${c.nome.split(" ")[0]}! Aqui é do Mulheres Curadas.`,
                            )}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex min-h-[40px] items-center gap-2 rounded-full bg-emerald-600 px-4 text-sm font-semibold text-white"
                          >
                            <MessageCircle className="h-4 w-4" aria-hidden="true" /> WhatsApp
                          </a>
                          <a
                            href={`tel:${c.telefone.replace(/[^\d+]/g, "")}`}
                            className="inline-flex min-h-[40px] items-center gap-2 rounded-full px-4 text-sm font-semibold text-foreground/70 ring-1 ring-[color:var(--admin-linha)]"
                          >
                            <Phone className="h-4 w-4" aria-hidden="true" /> {c.telefone}
                          </a>
                        </>
                      )}
                      <button
                        type="button"
                        onClick={() => void marcar(c, !c.lido)}
                        className="inline-flex min-h-[40px] items-center rounded-full px-4 text-sm font-semibold text-foreground/70 ring-1 ring-[color:var(--admin-linha)]"
                      >
                        {c.lido ? "Marcar como não lida" : "Marcar como lida"}
                      </button>
                      <span className="ml-auto">
                        <BotaoExcluir
                          titulo="Excluir esta mensagem?"
                          texto="Ela será apagada de vez."
                          aoConfirmar={() => excluir(c)}
                        />
                      </span>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
