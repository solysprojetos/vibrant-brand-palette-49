import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  CalendarCheck2,
  CalendarClock,
  CalendarHeart,
  Camera,
  ClipboardList,
  FileText,
  ImagePlus,
  Inbox,
  MessageSquareHeart,
  Plus,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { LIMITE_INSCRICOES } from "@/config/conteudo";
import { formatarDataHora, situacaoDoEvento } from "@/lib/cms/util";
import type { Evento } from "@/lib/cms/tipos";
import { TIPOS_PUBLICACAO } from "@/lib/cms/tipos";
import { useSessao } from "../sessao";
import {
  BOTAO_PRIMARIO,
  BOTAO_SECUNDARIO,
  BOTAO_SUAVE,
  CARTAO,
  Carregando,
  ErroCarregar,
  Selo,
} from "../ui";

type Ultima = {
  tipo: string;
  titulo: string;
  quando: string;
  publicado: boolean;
  para: string;
  id: string;
};

function saudacao(): string {
  const hora = Number(
    new Date().toLocaleString("pt-BR", {
      timeZone: "America/Fortaleza",
      hour: "2-digit",
      hour12: false,
    }),
  );
  if (hora < 12) return "Bom dia";
  if (hora < 18) return "Boa tarde";
  return "Boa noite";
}

/** Conta linhas sem baixar nenhuma (head + count). */
async function contar(tabela: string, soNaoLidos = false): Promise<number> {
  const base = supabase().from(tabela).select("id", { count: "exact", head: true });
  const { count, error } = await (soNaoLidos ? base.eq("lido", false) : base);
  if (error) throw error;
  return count ?? 0;
}

function useResumo() {
  return useQuery({
    queryKey: ["admin", "dashboard"],
    queryFn: async () => {
      const cliente = supabase();
      const [
        eventosR,
        fotos,
        albuns,
        publicacoes,
        naoLidos,
        inscricoes,
        eventosRec,
        pubsRec,
        albunsRec,
      ] = await Promise.all([
        cliente.from("mc_eventos").select("id, slug, titulo, inicio, fim, realizado, publicado"),
        contar("mc_fotos"),
        contar("mc_albuns"),
        contar("mc_publicacoes"),
        contar("mc_contatos", true),
        // Inscricoes: a leitura depende da politica da migracao do painel;
        // se ainda nao existir, o cartao mostra so o traco.
        contar("inscricoes").catch(() => null),
        cliente
          .from("mc_eventos")
          .select("id, titulo, publicado, atualizado_em")
          .order("atualizado_em", { ascending: false })
          .limit(5),
        cliente
          .from("mc_publicacoes")
          .select("id, titulo, tipo, publicado, atualizado_em")
          .order("atualizado_em", { ascending: false })
          .limit(5),
        cliente
          .from("mc_albuns")
          .select("id, titulo, publicado, atualizado_em")
          .order("atualizado_em", { ascending: false })
          .limit(5),
      ]);
      if (eventosR.error) throw eventosR.error;
      const eventos = (eventosR.data ?? []) as Pick<
        Evento,
        "id" | "slug" | "titulo" | "inicio" | "fim" | "realizado" | "publicado"
      >[];
      const agora = Date.now();
      const proximos = eventos
        .filter((e) => situacaoDoEvento(e, agora) !== "realizado")
        .sort((a, b) => a.inicio.localeCompare(b.inicio));
      const realizados = eventos.filter((e) => situacaoDoEvento(e, agora) === "realizado").length;

      const ultimas: Ultima[] = [
        ...(eventosRec.data ?? []).map((e) => ({
          id: e.id,
          tipo: "Evento",
          titulo: e.titulo,
          quando: e.atualizado_em,
          publicado: e.publicado,
          para: "/admin/eventos",
        })),
        ...(pubsRec.data ?? []).map((p) => ({
          id: p.id,
          tipo: TIPOS_PUBLICACAO[p.tipo as keyof typeof TIPOS_PUBLICACAO]?.rotulo ?? "Mensagem",
          titulo: p.titulo,
          quando: p.atualizado_em,
          publicado: p.publicado,
          para: "/admin/mensagens",
        })),
        ...(albunsRec.data ?? []).map((a) => ({
          id: a.id,
          tipo: "Álbum",
          titulo: a.titulo,
          quando: a.atualizado_em,
          publicado: a.publicado,
          para: "/admin/galeria",
        })),
      ]
        .sort((a, b) => b.quando.localeCompare(a.quando))
        .slice(0, 5);

      return {
        totalEventos: eventos.length,
        proximos,
        realizados,
        fotos,
        albuns,
        publicacoes,
        naoLidos,
        inscricoes,
        ultimas,
      };
    },
  });
}

function Indicador({
  titulo,
  valor,
  detalhe,
  icone: Icone,
  para,
  atraso,
}: {
  titulo: string;
  valor: number | string;
  detalhe?: string;
  icone: typeof CalendarHeart;
  para: string;
  atraso: number;
}) {
  return (
    <Link
      to={para as "/admin"}
      className={`${CARTAO} admin-surgir group flex min-h-[132px] flex-col p-4 transition sm:min-h-[148px] sm:p-6 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-20px_rgba(86,18,48,0.35)]`}
      style={{ animationDelay: `${atraso}ms` }}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-foreground/70 sm:text-[15px]">{titulo}</p>
        <span className="hidden h-10 w-10 sm:flex shrink-0 items-center justify-center rounded-full bg-[color:var(--admin-rosado)] text-[color:var(--admin-vinho)] transition group-hover:scale-105">
          <Icone className="h-[18px] w-[18px]" aria-hidden="true" />
        </span>
      </div>
      <p className="mt-auto pt-4 text-display text-4xl sm:text-5xl leading-none text-[color:var(--admin-vinho)]">
        {valor}
      </p>
      {detalhe && <p className="mt-2 text-xs text-foreground/55">{detalhe}</p>}
    </Link>
  );
}

export function PaginaDashboard() {
  const { acesso } = useSessao();
  const { data, isLoading, error } = useResumo();
  const primeiroNome = (acesso?.nome || "").trim().split(/\s+/)[0];
  const tratamento = /^(pastora|pra\.?|missionária|irmã)$/i.test(primeiroNome)
    ? (acesso?.nome ?? "").trim().split(/\s+/).slice(0, 2).join(" ")
    : primeiroNome;

  return (
    <>
      <div className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-display text-5xl leading-tight text-[color:var(--admin-vinho)] md:text-6xl">
            {saudacao()}
            {tratamento ? `, ${tratamento}` : ""}!
          </h1>
          <p className="mt-2 text-[15px] text-foreground/65">
            Acompanhe os números do site e acesse rapidamente as principais ações.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link to="/admin/eventos" search={{ id: "novo" }} className={BOTAO_PRIMARIO}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Novo evento
          </Link>
          <Link to="/admin/galeria" className={BOTAO_SECUNDARIO}>
            <ImagePlus className="h-4 w-4" aria-hidden="true" />
            Enviar fotos
          </Link>
        </div>
      </div>

      {error ? (
        <ErroCarregar erro={error} />
      ) : isLoading || !data ? (
        <Carregando texto="Somando os números" />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-3">
            <Indicador
              titulo="Eventos cadastrados"
              valor={data.totalEventos}
              icone={CalendarHeart}
              para="/admin/eventos"
              atraso={0}
            />
            <Indicador
              titulo="Próximos eventos"
              valor={data.proximos.length}
              icone={CalendarClock}
              para="/admin/eventos"
              atraso={40}
            />
            <Indicador
              titulo="Eventos realizados"
              valor={data.realizados}
              icone={CalendarCheck2}
              para="/admin/eventos"
              atraso={80}
            />
            <Indicador
              titulo="Fotos publicadas"
              valor={data.fotos}
              detalhe={`${data.albuns} ${data.albuns === 1 ? "álbum" : "álbuns"}`}
              icone={Camera}
              para="/admin/galeria"
              atraso={120}
            />
            <Indicador
              titulo="Mensagens e testemunhos"
              valor={data.publicacoes}
              icone={MessageSquareHeart}
              para="/admin/mensagens"
              atraso={160}
            />
            <Indicador
              titulo="Contatos não lidos"
              valor={data.naoLidos}
              icone={Inbox}
              para="/admin/contatos"
              atraso={200}
            />
          </div>

          {data.inscricoes !== null && (
            <Link
              to="/painel"
              className={`${CARTAO} admin-surgir mt-5 flex flex-col gap-4 p-6 transition hover:shadow-[0_18px_40px_-20px_rgba(86,18,48,0.35)] sm:flex-row sm:items-center`}
              style={{ animationDelay: "240ms" }}
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[color:var(--admin-rosado)] text-[color:var(--admin-vinho)]">
                <ClipboardList className="h-5 w-5" aria-hidden="true" />
              </span>
              <div className="flex-1">
                <p className="text-[15px] text-foreground/70">Inscrições do próximo encontro</p>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-[color:var(--admin-rosado)]">
                  <div
                    className="h-full rounded-full bg-[color:var(--admin-vinho)] transition-all"
                    style={{
                      width: `${Math.min(100, (data.inscricoes / LIMITE_INSCRICOES) * 100)}%`,
                    }}
                  />
                </div>
              </div>
              <p className="text-display text-4xl text-[color:var(--admin-vinho)]">
                {data.inscricoes}
                <span className="text-xl text-foreground/45"> / {LIMITE_INSCRICOES}</span>
              </p>
            </Link>
          )}

          <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
            <section className={`${CARTAO} p-6 md:p-8`}>
              <h2 className="text-display text-3xl text-[color:var(--admin-vinho)]">
                Últimas publicações
              </h2>
              {data.ultimas.length === 0 ? (
                <p className="mt-6 text-sm text-foreground/60">
                  Nada publicado ainda. Comece cadastrando um evento ou um testemunho.
                </p>
              ) : (
                <ul className="mt-4 divide-y divide-[color:var(--admin-linha)]">
                  {data.ultimas.map((u) => (
                    <li key={`${u.tipo}-${u.id}`}>
                      <Link
                        to={u.para as "/admin/eventos"}
                        search={
                          (u.para === "/admin/galeria" ? { album: u.id } : { id: u.id }) as {
                            id: string;
                          }
                        }
                        className="-mx-3 flex items-center justify-between gap-4 rounded-2xl px-3 py-4 transition hover:bg-[color:var(--admin-fundo)]"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-[17px] font-semibold text-foreground/90">
                            {u.titulo}
                          </p>
                          <p className="mt-0.5 text-xs text-foreground/55">
                            {u.tipo} · atualizado em {formatarDataHora(u.quando)}
                          </p>
                        </div>
                        <Selo tom={u.publicado ? "verde" : "cinza"}>
                          {u.publicado ? "Publicado" : "Rascunho"}
                        </Selo>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className={`${CARTAO} flex flex-col p-6 md:p-8`}>
              <h2 className="text-display text-3xl text-[color:var(--admin-vinho)]">
                Próximos eventos
              </h2>
              {data.proximos.length === 0 ? (
                <p className="mt-6 text-sm text-foreground/60">Nenhum evento futuro cadastrado.</p>
              ) : (
                <ul className="mt-5 space-y-3">
                  {data.proximos.slice(0, 3).map((e, i) => {
                    const d = new Date(e.inicio);
                    const dia = d.toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      timeZone: "America/Fortaleza",
                    });
                    const mes = d
                      .toLocaleDateString("pt-BR", {
                        month: "short",
                        timeZone: "America/Fortaleza",
                      })
                      .replace(".", "");
                    return (
                      <li key={e.id}>
                        <Link
                          to="/admin/eventos"
                          search={{ id: e.id }}
                          className="-mx-2 flex items-center gap-4 rounded-2xl px-2 py-2 transition hover:bg-[color:var(--admin-fundo)]"
                        >
                          <span className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-[color:var(--admin-vinho)] text-white">
                            <span className="text-display text-lg leading-none">{dia}</span>
                            <span className="text-[0.55rem] uppercase tracking-[0.15em] opacity-80">
                              {mes}
                            </span>
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate text-[15px] font-semibold text-foreground/90">
                              {e.titulo}
                            </span>
                            <span className="block text-xs text-foreground/55">
                              {i === 0 ? "Próximo evento" : formatarDataHora(e.inicio)}
                              {!e.publicado && " · rascunho"}
                            </span>
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
              <div className="mt-auto space-y-2 pt-6">
                <Link
                  to="/admin/mensagens"
                  search={{ id: "novo" }}
                  className={`${BOTAO_SUAVE} w-full`}
                >
                  <MessageSquareHeart className="h-4 w-4" aria-hidden="true" />
                  Publicar testemunho
                </Link>
                <Link
                  to="/admin/conteudo"
                  className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full text-sm font-semibold text-[color:var(--admin-vinho)] transition hover:bg-[color:var(--admin-fundo)]"
                >
                  <FileText className="h-4 w-4" aria-hidden="true" />
                  Editar textos do site
                </Link>
              </div>
            </section>
          </div>
        </>
      )}
    </>
  );
}
