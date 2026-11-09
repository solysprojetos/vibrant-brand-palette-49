import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Camera,
  CameraOff,
  CheckCircle2,
  Loader2,
  QrCode,
  RotateCcw,
  Search,
  UserCheck,
  UserPlus,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { mascaraTelefone } from "@/components/formulario-inscricao";
import type { Evento } from "@/lib/cms/tipos";
import { formatarData, formatarHora, traduzirErro } from "@/lib/cms/util";
import { CARTAO, Carregando, ConfirmarExclusao, ErroCarregar } from "../ui";

/**
 * Check-in da entrada: a recepcao le o QR code do ingresso com a camera do
 * celular ou busca a pessoa pelo nome, e confirma a entrada.
 *
 * Quem chega sem inscricao e inscrita ali mesmo (aba "Nova inscrição"): so
 * nome completo, telefone e igreja. A pessoa ja entra como presente.
 *
 * Tudo passa pelas funcoes mc_checkin_lista / mc_checkin_marcar /
 * mc_checkin_inscrever do banco:
 * a recepcao ve so nome, igreja e codigo (nunca e-mail ou telefone), e duas
 * leituras do mesmo ingresso nunca contam duas vezes.
 */

type Inscrita = {
  id: string;
  nome: string;
  igreja: string | null;
  codigo: string;
  checkin_em: string | null;
  checkin_por: string | null;
};

type Resultado =
  | { tipo: "ok"; nome: string; codigo: string; nova?: boolean }
  | { tipo: "ja"; nome: string; quando: string; por: string | null }
  | { tipo: "nao-encontrado"; codigo: string }
  | { tipo: "desfeito"; nome: string };

const CHAVE = ["admin", "checkin"];

/** O QR guarda o endereco .../checkin/?c=MC-XXXX-XXXX; aceita tambem so o codigo. */
function extrairCodigo(texto: string): string | null {
  const achado = texto.toUpperCase().match(/MC-[A-Z0-9]{4}-[A-Z0-9]{4}/);
  return achado ? achado[0] : null;
}

/** Busca sem acento e sem diferenca de maiuscula. */
function normalizar(texto: string): string {
  return texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

/** "MARIA DA SILVA" -> "Maria da Silva" (o cadastro guarda em caixa alta). */
function nomeBonito(nome: string): string {
  return nome
    .toLocaleLowerCase("pt-BR")
    .split(/\s+/)
    .map((p) =>
      /^(da|de|do|das|dos|e)$/.test(p) ? p : p.charAt(0).toLocaleUpperCase("pt-BR") + p.slice(1),
    )
    .join(" ");
}

function avisar(tipo: Resultado["tipo"]) {
  try {
    navigator.vibrate?.(tipo === "ok" ? 80 : [60, 60, 60]);
  } catch {
    /* sem vibracao, sem problema */
  }
}

export function PaginaCheckin() {
  const cliente = useQueryClient();
  const [modo, setModo] = useState<"qr" | "nome" | "inscrever">("qr");
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<"faltam" | "presentes" | "todas">("faltam");
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [marcando, setMarcando] = useState<string | null>(null);

  const lista = useQuery({
    queryKey: CHAVE,
    // Outras recepcionistas confirmam entradas ao mesmo tempo: a lista se
    // atualiza sozinha a cada 15 segundos.
    refetchInterval: 15_000,
    queryFn: async () => {
      const { data, error } = await supabase().rpc("mc_checkin_lista");
      if (error) throw error;
      return (data ?? []) as Inscrita[];
    },
  });

  const evento = useQuery({
    queryKey: ["admin", "checkin", "evento"],
    queryFn: async () => {
      const desde = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString();
      const { data } = await supabase()
        .from("mc_eventos")
        .select("titulo, inicio, local")
        .gte("inicio", desde)
        .order("inicio")
        .limit(1)
        .maybeSingle();
      return data as Pick<Evento, "titulo" | "inicio" | "local"> | null;
    },
  });

  const marcar = useCallback(
    async (codigo: string, desfazer = false) => {
      setMarcando(codigo);
      try {
        const { data, error } = await supabase().rpc("mc_checkin_marcar", {
          p_codigo: codigo,
          p_desfazer: desfazer,
        });
        if (error) throw error;
        const linha = (data as (Inscrita & { ja_estava: boolean })[] | null)?.[0];
        let r: Resultado;
        if (!linha) r = { tipo: "nao-encontrado", codigo };
        else if (desfazer) r = { tipo: "desfeito", nome: nomeBonito(linha.nome) };
        else if (linha.ja_estava)
          r = {
            tipo: "ja",
            nome: nomeBonito(linha.nome),
            quando: linha.checkin_em ?? "",
            por: linha.checkin_por,
          };
        else r = { tipo: "ok", nome: nomeBonito(linha.nome), codigo: linha.codigo };
        setResultado(r);
        avisar(r.tipo);
        if (linha) {
          cliente.setQueryData<Inscrita[]>(CHAVE, (atual) =>
            atual?.map((i) =>
              i.codigo === linha.codigo
                ? { ...i, checkin_em: linha.checkin_em, checkin_por: linha.checkin_por }
                : i,
            ),
          );
          void cliente.invalidateQueries({ queryKey: ["admin", "dashboard"] });
        }
      } catch (erro) {
        toast.error(traduzirErro(erro));
      } finally {
        setMarcando(null);
      }
    },
    [cliente],
  );

  const inscritas = useMemo(() => lista.data ?? [], [lista.data]);
  const presentes = inscritas.filter((i) => i.checkin_em).length;

  const buscando = normalizar(busca.trim()).length >= 2;

  // Com algo digitado procura em todas; sem nada, mostra a lista inteira
  // pelo filtro escolhido (quem falta entrar, quem ja entrou ou todas).
  const encontradas = useMemo(() => {
    const termo = normalizar(busca.trim());
    if (termo.length >= 2) {
      const codigo = extrairCodigo(busca);
      return inscritas
        .filter((i) =>
          codigo ? i.codigo === codigo : normalizar(`${i.nome} ${i.codigo}`).includes(termo),
        )
        .slice(0, 50);
    }
    return inscritas.filter((i) =>
      filtro === "todas" ? true : filtro === "presentes" ? i.checkin_em : !i.checkin_em,
    );
  }, [busca, inscritas, filtro]);

  // Ultimas entradas confirmadas (de qualquer recepcionista), mais recentes primeiro.
  const ultimas = useMemo(
    () =>
      inscritas
        .filter((i) => i.checkin_em)
        .sort((a, b) => (b.checkin_em ?? "").localeCompare(a.checkin_em ?? ""))
        .slice(0, 8),
    [inscritas],
  );

  const linha = (i: Inscrita) => (
    <LinhaInscrita
      key={i.id}
      inscrita={i}
      marcando={marcando === i.codigo}
      aoConfirmar={() => void marcar(i.codigo)}
      aoDesfazer={() => marcar(i.codigo, true)}
    />
  );

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-display text-4xl leading-tight text-[color:var(--admin-vinho)] md:text-5xl">
            Check-in da entrada
          </h1>
          {evento.data && (
            <p className="mt-1 text-[15px] text-foreground/65">
              {evento.data.titulo} · {formatarData(evento.data.inicio)},{" "}
              {formatarHora(evento.data.inicio)}
              {evento.data.local && ` · ${evento.data.local}`}
            </p>
          )}
        </div>
        <div className={`${CARTAO} flex items-center gap-4 px-5 py-3`} aria-live="polite">
          <UserCheck className="h-6 w-6 text-[color:var(--admin-vinho)]" aria-hidden="true" />
          <p className="text-display text-4xl leading-none text-[color:var(--admin-vinho)]">
            {presentes}
            <span className="text-xl text-foreground/45"> / {inscritas.length}</span>
          </p>
          <p className="text-xs leading-tight text-foreground/60">
            presenças
            <br />
            confirmadas
          </p>
        </div>
      </div>

      <div className="mb-5 grid grid-cols-3 gap-1 sm:gap-2 rounded-full bg-white p-1 ring-1 ring-[color:var(--admin-linha)] sm:inline-grid">
        {(
          [
            ["qr", "Ler QR code", QrCode],
            ["nome", "Buscar nome", Search],
            ["inscrever", "Nova inscrição", UserPlus],
          ] as const
        ).map(([chave, rotulo, Icone]) => (
          <button
            key={chave}
            type="button"
            onClick={() => setModo(chave)}
            aria-pressed={modo === chave}
            className={`inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-full px-2 text-xs font-semibold transition sm:gap-2 sm:px-5 sm:text-sm ${
              modo === chave ? "bg-[color:var(--admin-vinho)] text-white" : "text-foreground/70"
            }`}
          >
            <Icone className="hidden h-4 w-4 shrink-0 min-[400px]:block" aria-hidden="true" />
            {rotulo}
          </button>
        ))}
      </div>

      <AvisoResultado resultado={resultado} aoDesfazer={(codigo) => void marcar(codigo, true)} />

      {lista.error ? (
        <ErroCarregar erro={lista.error} />
      ) : lista.isLoading ? (
        <Carregando texto="Carregando a lista de inscritas" />
      ) : modo === "inscrever" ? (
        <FormularioNaPorta
          aoInscrever={(nova) => {
            cliente.setQueryData<Inscrita[]>(CHAVE, (atual) =>
              [...(atual ?? []), nova].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")),
            );
            void cliente.invalidateQueries({ queryKey: CHAVE });
            void cliente.invalidateQueries({ queryKey: ["admin", "dashboard"] });
            const r: Resultado = {
              tipo: "ok",
              nome: nomeBonito(nova.nome),
              codigo: nova.codigo,
              nova: true,
            };
            setResultado(r);
            avisar(r.tipo);
          }}
        />
      ) : modo === "qr" ? (
        <>
          <LeitorQr ocupado={marcando !== null} aoLer={(codigo) => void marcar(codigo)} />
          <section className={`${CARTAO} mt-5 p-4 md:p-6`}>
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="text-lg font-semibold text-[color:var(--admin-vinho)]">
                Últimas entradas
              </h2>
              <button
                type="button"
                onClick={() => {
                  setBusca("");
                  setFiltro("todas");
                  setModo("nome");
                }}
                className="min-h-[44px] text-sm font-semibold text-[color:var(--admin-vinho)] underline-offset-4 hover:underline"
              >
                Ver lista completa
              </button>
            </div>
            {ultimas.length === 0 ? (
              <p className="py-6 text-center text-sm text-foreground/60">
                Nenhuma entrada confirmada ainda.
              </p>
            ) : (
              <ul className="mt-1 divide-y divide-[color:var(--admin-linha)]">
                {ultimas.map(linha)}
              </ul>
            )}
          </section>
        </>
      ) : (
        <section className={`${CARTAO} p-4 md:p-6`}>
          <label className="relative block">
            <span className="sr-only">Nome ou código do ingresso</span>
            <Search
              className="pointer-events-none absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-foreground/40"
              aria-hidden="true"
            />
            <input
              autoFocus
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Nome ou código do ingresso"
              className="w-full rounded-2xl border border-[color:var(--admin-linha)] bg-[color:var(--admin-fundo)] py-3.5 pr-4 pl-12 text-lg outline-none focus:border-[color:var(--admin-vinho)]/40 focus:ring-4 focus:ring-[color:var(--admin-vinho)]/10 sm:py-4"
            />
          </label>
          {!buscando && (
            <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Filtrar a lista">
              {(
                [
                  ["faltam", `Faltam entrar (${inscritas.length - presentes})`],
                  ["presentes", `Já entraram (${presentes})`],
                  ["todas", `Todas (${inscritas.length})`],
                ] as const
              ).map(([chave, rotulo]) => (
                <button
                  key={chave}
                  type="button"
                  onClick={() => setFiltro(chave)}
                  aria-pressed={filtro === chave}
                  className={`min-h-[40px] rounded-full px-4 text-sm font-semibold ring-1 transition ${
                    filtro === chave
                      ? "bg-[color:var(--admin-vinho)] text-white ring-[color:var(--admin-vinho)]"
                      : "bg-white text-foreground/70 ring-[color:var(--admin-linha)]"
                  }`}
                >
                  {rotulo}
                </button>
              ))}
            </div>
          )}
          <ul className="mt-3 divide-y divide-[color:var(--admin-linha)]">
            {encontradas.length === 0 && (
              <li className="py-6 text-center text-sm text-foreground/60">
                {buscando
                  ? `Ninguém encontrado com “${busca}”.`
                  : filtro === "faltam"
                    ? "Todas as inscritas já entraram."
                    : "Ninguém nesta lista ainda."}
              </li>
            )}
            {encontradas.map(linha)}
          </ul>
        </section>
      )}
    </>
  );
}

/** Uma pessoa da lista: nome, codigo, igreja e o botao de entrada. */
function LinhaInscrita({
  inscrita: i,
  marcando,
  aoConfirmar,
  aoDesfazer,
}: {
  inscrita: Inscrita;
  marcando: boolean;
  aoConfirmar: () => void;
  aoDesfazer: () => Promise<void> | void;
}) {
  return (
    <li className="flex items-center gap-3 py-3">
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-[17px] leading-snug font-semibold break-words text-foreground/90">
          {nomeBonito(i.nome)}
        </p>
        <p className="mt-0.5 line-clamp-2 text-xs break-words text-foreground/55">
          {i.codigo}
          {i.igreja && ` · ${i.igreja}`}
          {i.checkin_em &&
            ` · entrou às ${formatarHora(i.checkin_em)}${i.checkin_por ? ` (${i.checkin_por})` : ""}`}
        </p>
      </div>
      {i.checkin_em ? (
        <ConfirmarExclusao
          titulo="Desfazer esta entrada?"
          texto={`${nomeBonito(i.nome)} volta a aparecer como não presente.`}
          aoConfirmar={aoDesfazer}
          rotuloAcao="Desfazer"
        >
          <button
            type="button"
            className="inline-flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-full bg-emerald-50 px-3 text-sm font-semibold text-emerald-800 ring-1 ring-emerald-200 sm:gap-2 sm:px-4"
          >
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            Presente
          </button>
        </ConfirmarExclusao>
      ) : (
        <button
          type="button"
          onClick={aoConfirmar}
          disabled={marcando}
          className="inline-flex min-h-[44px] shrink-0 items-center gap-2 rounded-full bg-[color:var(--admin-vinho)] px-4 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-60 sm:px-5"
        >
          {marcando && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          Confirmar<span className="hidden sm:inline"> entrada</span>
        </button>
      )}
    </li>
  );
}

function AvisoResultado({
  resultado,
  aoDesfazer,
}: {
  resultado: Resultado | null;
  aoDesfazer: (codigo: string) => void;
}) {
  if (!resultado) return <div aria-live="assertive" className="sr-only" />;
  const estilos = {
    ok: "bg-emerald-600 text-white",
    ja: "bg-amber-100 text-amber-900 ring-1 ring-amber-300",
    "nao-encontrado": "bg-red-600 text-white",
    desfeito: "bg-stone-100 text-stone-700 ring-1 ring-stone-200",
  } as const;
  const codigoDoOk = resultado.tipo === "ok" ? resultado.codigo : undefined;

  return (
    <div
      key={JSON.stringify(resultado)}
      aria-live="assertive"
      className={`admin-surgir mb-5 flex items-center gap-4 rounded-3xl px-5 py-4 ${estilos[resultado.tipo]}`}
    >
      {resultado.tipo === "ok" && <CheckCircle2 className="h-9 w-9 shrink-0" aria-hidden="true" />}
      {resultado.tipo === "nao-encontrado" && (
        <XCircle className="h-9 w-9 shrink-0" aria-hidden="true" />
      )}
      {(resultado.tipo === "ja" || resultado.tipo === "desfeito") && (
        <RotateCcw className="h-8 w-8 shrink-0" aria-hidden="true" />
      )}
      <div className="min-w-0 flex-1">
        {resultado.tipo === "ok" && (
          <>
            <p className="text-sm opacity-90">
              {resultado.nova ? "Inscrição feita e entrada confirmada" : "Entrada confirmada"}
            </p>
            <p className="text-2xl leading-tight font-semibold break-words">{resultado.nome}</p>
            {resultado.nova && <p className="text-sm opacity-90">Ingresso {resultado.codigo}</p>}
          </>
        )}
        {resultado.tipo === "ja" && (
          <>
            <p className="text-sm">Este ingresso já foi usado</p>
            <p className="text-xl leading-tight font-semibold break-words">{resultado.nome}</p>
            <p className="text-sm">
              Entrou às {resultado.quando ? formatarHora(resultado.quando) : "—"}
              {resultado.por && ` · confirmado por ${resultado.por}`}
            </p>
          </>
        )}
        {resultado.tipo === "nao-encontrado" && (
          <>
            <p className="text-sm opacity-90">Ingresso não encontrado</p>
            <p className="text-xl font-semibold">{resultado.codigo}</p>
            <p className="text-sm opacity-90">
              Confira o nome na busca ou peça o e-mail de confirmação.
            </p>
          </>
        )}
        {resultado.tipo === "desfeito" && (
          <p className="text-[15px]">
            Entrada de <strong>{resultado.nome}</strong> desfeita.
          </p>
        )}
      </div>
      {codigoDoOk && (
        <button
          type="button"
          onClick={() => aoDesfazer(codigoDoOk)}
          className="shrink-0 rounded-full bg-white/15 px-4 py-2 text-xs font-semibold hover:bg-white/25"
        >
          Desfazer
        </button>
      )}
    </div>
  );
}

/**
 * Inscricao feita na porta: nome completo, telefone e igreja (se frequentar).
 * Sem e-mail. A pessoa ja sai daqui com a presenca confirmada.
 */
function FormularioNaPorta({ aoInscrever }: { aoInscrever: (nova: Inscrita) => void }) {
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [temIgreja, setTemIgreja] = useState<"" | "sim" | "nao">("");
  const [igreja, setIgreja] = useState("");
  const [erros, setErros] = useState<Partial<Record<"nome" | "telefone" | "igreja", string>>>({});
  const [enviando, setEnviando] = useState(false);
  const primeiroCampo = useRef<HTMLInputElement>(null);

  const campo =
    "w-full rounded-2xl border border-[color:var(--admin-linha)] bg-[color:var(--admin-fundo)] px-4 py-3.5 text-lg outline-none focus:border-[color:var(--admin-vinho)]/40 focus:ring-4 focus:ring-[color:var(--admin-vinho)]/10";

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    const novosErros: typeof erros = {};
    const nomeLimpo = nome.trim().replace(/\s+/g, " ");
    if (nomeLimpo.length < 3 || !nomeLimpo.includes(" "))
      novosErros.nome = "Escreva o nome completo (nome e sobrenome).";
    if (telefone.replace(/\D/g, "").length < 10)
      novosErros.telefone = "Informe o DDD e o número, como (85) 90000-0000.";
    if (!temIgreja) novosErros.igreja = "Escolha se frequenta alguma igreja.";
    else if (temIgreja === "sim" && igreja.trim().length < 2)
      novosErros.igreja = "Escreva o nome da igreja.";
    setErros(novosErros);
    if (Object.keys(novosErros).length > 0) return;

    setEnviando(true);
    try {
      const { data, error } = await supabase().rpc("mc_checkin_inscrever", {
        p_nome: nomeLimpo,
        p_telefone: telefone.trim(),
        p_igreja: temIgreja === "sim" ? igreja.trim() : null,
      });
      if (error) throw error;
      const nova = (data as Inscrita[] | null)?.[0];
      if (!nova) throw new Error("Algo deu errado. Tente de novo.");
      aoInscrever(nova);
      setNome("");
      setTelefone("");
      setTemIgreja("");
      setIgreja("");
      primeiroCampo.current?.focus();
    } catch (erro) {
      const msg = erro instanceof Object && "message" in erro ? String(erro.message) : "";
      if (/LIMITE_DE_INSCRICOES/.test(msg)) toast.error("As vagas do encontro acabaram.");
      else if (/NOME_INVALIDO/.test(msg)) toast.error("Escreva o nome completo.");
      else if (/TELEFONE_INVALIDO/.test(msg))
        toast.error("Telefone inválido: informe DDD e número.");
      else if (/SEM_PERMISSAO/.test(msg)) toast.error("Seu usuário não tem acesso à recepção.");
      else if (/mc_checkin_inscrever|could not find the function/i.test(msg))
        toast.error(
          "O banco ainda não tem a inscrição pela recepção. Rode a migração 20261109120000_inscricao_na_recepcao.sql no Supabase.",
        );
      else toast.error(traduzirErro(erro));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <section className={`${CARTAO} p-4 md:p-6`}>
      <h2 className="text-lg font-semibold text-[color:var(--admin-vinho)]">
        Inscrever quem chegou sem inscrição
      </h2>
      <p className="mt-1 mb-5 text-sm text-foreground/60">
        A pessoa já fica com a entrada confirmada.
      </p>
      <form onSubmit={(e) => void enviar(e)} noValidate className="flex flex-col gap-4">
        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-foreground/80">
            Nome completo
          </span>
          <input
            ref={primeiroCampo}
            autoFocus
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            autoComplete="off"
            autoCapitalize="words"
            maxLength={120}
            disabled={enviando}
            aria-invalid={Boolean(erros.nome)}
            className={campo}
          />
          {erros.nome && <span className="mt-1.5 block text-sm text-red-700">{erros.nome}</span>}
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-foreground/80">Telefone</span>
          <input
            type="tel"
            inputMode="tel"
            value={telefone}
            onChange={(e) => setTelefone(mascaraTelefone(e.target.value))}
            placeholder="(85) 90000-0000"
            maxLength={16}
            autoComplete="off"
            disabled={enviando}
            aria-invalid={Boolean(erros.telefone)}
            className={campo}
          />
          {erros.telefone && (
            <span className="mt-1.5 block text-sm text-red-700">{erros.telefone}</span>
          )}
        </label>

        <fieldset>
          <legend className="mb-1.5 text-sm font-semibold text-foreground/80">
            Frequenta alguma igreja?
          </legend>
          <div className="grid grid-cols-2 gap-2">
            {(
              [
                ["sim", "Sim"],
                ["nao", "Não"],
              ] as const
            ).map(([valor, rotulo]) => (
              <button
                key={valor}
                type="button"
                onClick={() => setTemIgreja(valor)}
                aria-pressed={temIgreja === valor}
                disabled={enviando}
                className={`min-h-[48px] rounded-2xl text-base font-semibold ring-1 transition ${
                  temIgreja === valor
                    ? "bg-[color:var(--admin-vinho)] text-white ring-[color:var(--admin-vinho)]"
                    : "bg-[color:var(--admin-fundo)] text-foreground/75 ring-[color:var(--admin-linha)]"
                }`}
              >
                {rotulo}
              </button>
            ))}
          </div>
          {temIgreja === "sim" && (
            <label className="mt-3 block">
              <span className="sr-only">Nome da igreja</span>
              <input
                autoFocus
                value={igreja}
                onChange={(e) => setIgreja(e.target.value)}
                placeholder="Nome da igreja"
                maxLength={120}
                autoComplete="off"
                disabled={enviando}
                aria-invalid={Boolean(erros.igreja)}
                className={campo}
              />
            </label>
          )}
          {erros.igreja && (
            <span className="mt-1.5 block text-sm text-red-700">{erros.igreja}</span>
          )}
        </fieldset>

        <button
          type="submit"
          disabled={enviando}
          className="mt-1 inline-flex min-h-[52px] items-center justify-center gap-2 rounded-full bg-[color:var(--admin-vinho)] px-6 text-base font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
        >
          {enviando ? (
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
          ) : (
            <UserPlus className="h-5 w-5" aria-hidden="true" />
          )}
          Inscrever e confirmar entrada
        </button>
      </form>
    </section>
  );
}

/**
 * Leitor de QR pela camera traseira. Funciona no Android e no iPhone (o
 * decodificador e o jsQR, carregado so quando a camera abre). Depois de uma
 * leitura, o mesmo codigo fica 4 segundos ignorado, para nao repetir.
 */
function LeitorQr({ aoLer, ocupado }: { aoLer: (codigo: string) => void; ocupado: boolean }) {
  const video = useRef<HTMLVideoElement>(null);
  const tela = useRef<HTMLCanvasElement>(null);
  const [estado, setEstado] = useState<"parado" | "abrindo" | "lendo" | "erro">("parado");
  const [erro, setErro] = useState("");
  const [manual, setManual] = useState("");
  const ultimo = useRef<{ codigo: string; quando: number } | null>(null);
  const fluxo = useRef<MediaStream | null>(null);
  const aoLerRef = useRef(aoLer);
  const ocupadoRef = useRef(ocupado);
  aoLerRef.current = aoLer;
  ocupadoRef.current = ocupado;

  const parar = useCallback(() => {
    fluxo.current?.getTracks().forEach((t) => t.stop());
    fluxo.current = null;
    setEstado("parado");
  }, []);

  useEffect(() => parar, [parar]);

  const abrir = async () => {
    setErro("");
    if (!navigator.mediaDevices?.getUserMedia) {
      setEstado("erro");
      setErro("Este navegador não libera a câmera. Use a busca pelo nome ou digite o código.");
      return;
    }
    setEstado("abrindo");
    try {
      const [{ default: jsQR }, stream] = await Promise.all([
        import("jsqr"),
        navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        }),
      ]);
      fluxo.current = stream;
      const v = video.current!;
      v.srcObject = stream;
      await v.play();
      setEstado("lendo");

      const ctx = tela.current!.getContext("2d", { willReadFrequently: true })!;
      const passo = () => {
        if (!fluxo.current) return;
        if (v.readyState >= 2 && !ocupadoRef.current) {
          // Le uma versao reduzida do quadro: rapido ate em celular simples.
          const escala = Math.min(1, 640 / v.videoWidth);
          const w = Math.round(v.videoWidth * escala);
          const h = Math.round(v.videoHeight * escala);
          tela.current!.width = w;
          tela.current!.height = h;
          ctx.drawImage(v, 0, 0, w, h);
          const lido = jsQR(ctx.getImageData(0, 0, w, h).data, w, h, {
            inversionAttempts: "dontInvert",
          });
          const codigo = lido ? extrairCodigo(lido.data) : null;
          const agora = Date.now();
          if (
            codigo &&
            !(ultimo.current?.codigo === codigo && agora - ultimo.current.quando < 4000)
          ) {
            ultimo.current = { codigo, quando: agora };
            aoLerRef.current(codigo);
          }
        }
        requestAnimationFrame(passo);
      };
      requestAnimationFrame(passo);
    } catch (e) {
      parar();
      setEstado("erro");
      const nome = e instanceof DOMException ? e.name : "";
      setErro(
        nome === "NotAllowedError"
          ? "A câmera foi bloqueada. Libere o acesso à câmera nas configurações do navegador e tente de novo."
          : "Não foi possível abrir a câmera. Use a busca pelo nome ou digite o código.",
      );
    }
  };

  return (
    <section className={`${CARTAO} overflow-hidden`}>
      <div className="relative mx-auto aspect-square w-full max-w-md overflow-hidden bg-[#1d0b12] sm:mt-4 sm:aspect-[4/3] sm:rounded-3xl">
        <video
          ref={video}
          playsInline
          muted
          className={`h-full w-full object-cover ${estado === "lendo" ? "" : "invisible"}`}
        />
        <canvas ref={tela} className="hidden" />
        {estado === "lendo" && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="h-56 w-56 rounded-3xl border-4 border-white/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />
          </div>
        )}
        {estado !== "lendo" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center text-white">
            {estado === "abrindo" ? (
              <Loader2 className="h-8 w-8 animate-spin" aria-hidden="true" />
            ) : (
              <>
                <QrCode className="h-12 w-12 opacity-80" aria-hidden="true" />
                {erro && <p className="max-w-xs text-sm text-white/85">{erro}</p>}
                <button
                  type="button"
                  onClick={() => void abrir()}
                  className="inline-flex min-h-[48px] items-center gap-2 rounded-full bg-white px-6 text-sm font-semibold text-[color:var(--admin-vinho)]"
                >
                  <Camera className="h-4 w-4" aria-hidden="true" />
                  Abrir câmera
                </button>
              </>
            )}
          </div>
        )}
        {ocupado && estado === "lendo" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            <Loader2 className="h-10 w-10 animate-spin text-white" aria-hidden="true" />
          </div>
        )}
      </div>
      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        {estado === "lendo" && (
          <button
            type="button"
            onClick={parar}
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full px-4 text-sm font-semibold text-foreground/70 ring-1 ring-[color:var(--admin-linha)]"
          >
            <CameraOff className="h-4 w-4" aria-hidden="true" />
            Fechar câmera
          </button>
        )}
        <form
          className="flex flex-1 gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const codigo = extrairCodigo(manual);
            if (!codigo) return void toast.error("Digite o código completo, ex.: MC-K7QW-3PZT.");
            aoLer(codigo);
            setManual("");
          }}
        >
          <label className="sr-only" htmlFor="codigo-manual">
            Código do ingresso
          </label>
          <input
            id="codigo-manual"
            value={manual}
            onChange={(e) => setManual(e.target.value.toUpperCase())}
            placeholder="Código: MC-XXXX-XXXX"
            autoCapitalize="characters"
            className="min-w-0 flex-1 rounded-full border border-[color:var(--admin-linha)] bg-[color:var(--admin-fundo)] px-4 py-2.5 font-mono text-base outline-none focus:border-[color:var(--admin-vinho)]/40"
          />
          <button
            type="submit"
            className="shrink-0 rounded-full bg-[color:var(--admin-vinho)] px-5 text-sm font-semibold text-white"
          >
            Validar
          </button>
        </form>
      </div>
    </section>
  );
}
