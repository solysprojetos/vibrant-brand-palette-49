import { useCallback, useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Download, Loader2, RefreshCw, Search } from "lucide-react";
import { ENDPOINT_PAINEL, SITE_URL } from "@/config/conteudo";

/**
 * Painel de inscricoes — a lista de quem se inscreveu.
 *
 * Endereco discreto e fora do buscador (robots noindex): nao ha link para ele
 * em nenhuma pagina do site. A pagina nao fala direto com o banco; ela chama a
 * Edge Function "painel", que exige a senha em todo pedido. A senha fica no
 * sessionStorage, entao ela some quando a aba e fechada.
 */

type Inscricao = {
  id: string;
  criado_em: string;
  nome: string;
  telefone: string;
  email: string;
  frequenta_igreja: boolean;
  igreja: string | null;
  codigo: string;
  email_enviado_em: string | null;
  checkin_em: string | null;
};

const CHAVE_SENHA = "mc-painel-senha";

const CAMPO =
  "w-full rounded-full border border-primary/20 bg-background px-6 py-3 text-base text-foreground outline-none transition-all placeholder:text-foreground/40 focus:border-primary focus:ring-2 focus:ring-[color:var(--rose-soft)]";

/**
 * Mensagem do ingresso, para mandar na mao enquanto o envio automatico nao
 * esta ligado (ou para reenviar a quem perdeu o e-mail).
 *
 * O QR nao viaja como imagem: vai o endereco que desenha o mesmo QR do e-mail,
 * apontando para a pagina de baixa de presenca.
 */
function mensagemDoIngresso(inscricao: Inscricao): string {
  const checkin = `${SITE_URL}/checkin/?c=${encodeURIComponent(inscricao.codigo)}`;
  const qr = `https://api.qrserver.com/v1/create-qr-code/?size=600x600&margin=12&data=${encodeURIComponent(checkin)}`;
  const bruto = inscricao.nome.trim().split(/\s+/)[0] ?? "";
  const primeiro = bruto ? bruto[0] + bruto.slice(1).toLocaleLowerCase("pt-BR") : "";

  return [
    `Oi${primeiro ? `, ${primeiro}` : ""}! Sua inscrição no Mulheres Curadas está confirmada.`,
    "",
    `Seu ingresso: ${inscricao.codigo}`,
    `QR code: ${qr}`,
    "",
    "Guarde esta mensagem — é só apresentar o QR code na entrada do encontro.",
  ].join("\n");
}

/** wa.me exige o numero com o codigo do pais e so digitos. */
function linkWhatsapp(inscricao: Inscricao): string {
  const digitos = inscricao.telefone.replace(/\D/g, "");
  const numero = digitos.startsWith("55") ? digitos : `55${digitos}`;
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensagemDoIngresso(inscricao))}`;
}

function linkEmail(inscricao: Inscricao): string {
  return `mailto:${inscricao.email}?subject=${encodeURIComponent(
    "Seu ingresso — Mulheres Curadas",
  )}&body=${encodeURIComponent(mensagemDoIngresso(inscricao))}`;
}

function formatarData(valor: string | null): string {
  if (!valor) return "—";
  return new Date(valor).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Escapa o campo para CSV: aspas dobradas e o valor todo entre aspas. */
function campoCsv(valor: string): string {
  return `"${valor.replace(/"/g, '""')}"`;
}

function baixarCsv(inscricoes: Inscricao[]): void {
  const cabecalho = [
    "Data",
    "Nome",
    "Telefone",
    "E-mail",
    "Frequenta igreja",
    "Igreja",
    "Codigo",
    "E-mail enviado",
    "Presenca",
  ];
  const linhas = inscricoes.map((i) =>
    [
      formatarData(i.criado_em),
      i.nome,
      i.telefone,
      i.email,
      i.frequenta_igreja ? "Sim" : "Não",
      i.igreja ?? "",
      i.codigo,
      formatarData(i.email_enviado_em),
      formatarData(i.checkin_em),
    ]
      .map(campoCsv)
      .join(";"),
  );

  // O BOM no comeco faz o Excel abrir os acentos certos.
  const conteudo = `\uFEFF${[cabecalho.map(campoCsv).join(";"), ...linhas].join("\r\n")}`;
  const url = URL.createObjectURL(new Blob([conteudo], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `inscricoes-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export const Route = createFileRoute("/painel")({
  component: Painel,
  head: () => ({
    meta: [
      { title: "Painel de inscrições — Mulheres Curadas" },
      // Fora dos buscadores: esta pagina e so da organizacao.
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

function Painel() {
  const [senha, setSenha] = useState("");
  const [autenticado, setAutenticado] = useState(false);
  const [inscricoes, setInscricoes] = useState<Inscricao[]>([]);
  const [busca, setBusca] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");

  const chamar = useCallback(async (senhaUsada: string, corpo: Record<string, unknown>) => {
    let resposta: Response;
    try {
      resposta = await fetch(ENDPOINT_PAINEL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-senha": senhaUsada },
        body: JSON.stringify(corpo),
      });
    } catch {
      // Sem internet, ou o servico fora do ar, o navegador so diz
      // "Failed to fetch". Aqui isso vira uma frase que explica o que houve.
      throw new Error("Não conseguimos falar com o servidor. Verifique sua conexão.");
    }
    const dados = await resposta.json().catch(() => ({}));
    if (!resposta.ok) throw new Error(dados.erro ?? `Resposta ${resposta.status}`);
    return dados;
  }, []);

  const carregar = useCallback(
    async (senhaUsada: string) => {
      setCarregando(true);
      setErro("");
      try {
        const dados = await chamar(senhaUsada, { acao: "listar" });
        setInscricoes(dados.inscricoes ?? []);
        setAutenticado(true);
        sessionStorage.setItem(CHAVE_SENHA, senhaUsada);
      } catch (falha) {
        setErro(falha instanceof Error ? falha.message : "Não foi possível carregar.");
        setAutenticado(false);
        sessionStorage.removeItem(CHAVE_SENHA);
      } finally {
        setCarregando(false);
      }
    },
    [chamar],
  );

  // Se a senha ainda esta guardada na aba, a lista abre sozinha.
  useEffect(() => {
    const guardada = sessionStorage.getItem(CHAVE_SENHA);
    if (guardada) {
      setSenha(guardada);
      void carregar(guardada);
    }
  }, [carregar]);

  const alternarPresenca = async (inscricao: Inscricao) => {
    const acao = inscricao.checkin_em ? "desfazer" : "checkin";
    try {
      const dados = await chamar(senha, { acao, codigo: inscricao.codigo });
      setInscricoes((atual) =>
        atual.map((i) =>
          i.id === inscricao.id ? { ...i, checkin_em: dados.inscricao.checkin_em } : i,
        ),
      );
    } catch (falha) {
      setErro(falha instanceof Error ? falha.message : "Não foi possível salvar a presença.");
    }
  };

  const sair = () => {
    sessionStorage.removeItem(CHAVE_SENHA);
    setSenha("");
    setAutenticado(false);
    setInscricoes([]);
  };

  if (!autenticado) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6 text-foreground">
        <form
          className="w-full max-w-sm text-center"
          onSubmit={(evento) => {
            evento.preventDefault();
            void carregar(senha);
          }}
        >
          <p translate="no" className="eyebrow text-primary/80">
            Mulheres Curadas
          </p>
          {/* translate="no" impede o tradutor do navegador de reescrever o
            titulo — ele chegou a trocar "inscricoes" por "indicacoes". */}
          <h1 translate="no" className="mt-4 text-display text-3xl text-primary">
            Painel de inscrições
          </h1>
          <label htmlFor="senha" className="sr-only">
            Senha do painel
          </label>
          <input
            id="senha"
            type="password"
            autoComplete="current-password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            disabled={carregando}
            className={`${CAMPO} mt-8 text-center`}
            placeholder="Senha"
          />
          <button
            type="submit"
            disabled={carregando || !senha}
            className="mt-4 flex min-h-[44px] w-full items-center justify-center gap-3 rounded-full bg-primary px-6 py-4 text-xs uppercase tracking-[0.25em] text-primary-foreground transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {carregando && <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />}
            {carregando ? "Entrando" : "Entrar"}
          </button>
          {erro && (
            <p role="alert" className="mt-4 text-sm text-destructive">
              {erro}
            </p>
          )}
          <Link
            to="/"
            className="mt-8 inline-flex min-h-[44px] items-center gap-2 text-xs uppercase tracking-[0.25em] text-primary/70 transition-colors hover:text-primary"
          >
            <ArrowLeft aria-hidden="true" className="h-4 w-4" />
            Voltar ao site
          </Link>
        </form>
      </div>
    );
  }

  const termo = busca.trim().toLocaleLowerCase("pt-BR");
  const filtradas = termo
    ? inscricoes.filter((i) =>
        [i.nome, i.email, i.telefone, i.codigo, i.igreja ?? ""]
          .join(" ")
          .toLocaleLowerCase("pt-BR")
          .includes(termo),
      )
    : inscricoes;
  const presentes = inscricoes.filter((i) => i.checkin_em).length;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-primary/10">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-6 md:px-12">
          <div>
            <p translate="no" className="eyebrow text-primary/80">
              Mulheres Curadas
            </p>
            <h1 translate="no" className="mt-1 text-display text-2xl text-primary">
              Inscrições
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => void carregar(senha)}
              disabled={carregando}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-primary/20 px-5 text-xs uppercase tracking-[0.2em] text-primary transition-colors hover:border-primary/50 disabled:opacity-60"
            >
              <RefreshCw
                aria-hidden="true"
                className={`h-4 w-4 ${carregando ? "animate-spin" : ""}`}
              />
              Atualizar
            </button>
            <button
              type="button"
              onClick={() => baixarCsv(filtradas)}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-primary px-5 text-xs uppercase tracking-[0.2em] text-primary-foreground transition-opacity hover:opacity-90"
            >
              <Download aria-hidden="true" className="h-4 w-4" />
              Baixar planilha
            </button>
            <button
              type="button"
              onClick={sair}
              className="min-h-[44px] text-xs uppercase tracking-[0.2em] text-primary/70 transition-colors hover:text-primary"
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10 md:px-12">
        <div className="flex flex-wrap items-center gap-6">
          <p className="text-sm text-foreground/70">
            <strong className="text-primary">{inscricoes.length}</strong> inscritas ·{" "}
            <strong className="text-primary">{presentes}</strong> com presença confirmada
          </p>
          <div className="relative ml-auto w-full max-w-xs">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-primary/50"
            />
            <label htmlFor="busca" className="sr-only">
              Buscar inscrição
            </label>
            <input
              id="busca"
              type="search"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className={`${CAMPO} pl-12`}
              placeholder="Buscar por nome, e-mail, código"
            />
          </div>
        </div>

        {erro && (
          <p
            role="alert"
            className="mt-6 rounded-2xl bg-destructive/10 px-6 py-4 text-sm text-destructive"
          >
            {erro}
          </p>
        )}

        {filtradas.length === 0 ? (
          <p className="mt-12 text-center text-sm text-foreground/60">
            {inscricoes.length === 0
              ? "Nenhuma inscrição por enquanto."
              : "Nenhuma inscrição encontrada para essa busca."}
          </p>
        ) : (
          <div className="mt-8 overflow-x-auto rounded-3xl border border-primary/10">
            <table className="w-full min-w-[52rem] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-primary/10 text-[0.65rem] uppercase tracking-[0.18em] text-primary/70">
                  <th scope="col" className="px-5 py-4 font-normal">
                    Inscrição
                  </th>
                  <th scope="col" className="px-5 py-4 font-normal">
                    Nome
                  </th>
                  <th scope="col" className="px-5 py-4 font-normal">
                    Contato
                  </th>
                  <th scope="col" className="px-5 py-4 font-normal">
                    Igreja
                  </th>
                  <th scope="col" className="px-5 py-4 font-normal">
                    Ingresso
                  </th>
                  <th scope="col" className="px-5 py-4 font-normal">
                    Presença
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtradas.map((inscricao) => (
                  <tr key={inscricao.id} className="border-b border-primary/5 last:border-0">
                    <td className="px-5 py-4 align-top text-foreground/60">
                      {formatarData(inscricao.criado_em)}
                    </td>
                    <td className="px-5 py-4 align-top">{inscricao.nome}</td>
                    <td className="px-5 py-4 align-top text-foreground/70">
                      <a
                        href={`mailto:${inscricao.email}`}
                        className="underline underline-offset-4 hover:text-primary"
                      >
                        {inscricao.email}
                      </a>
                      <br />
                      <a
                        href={`tel:${inscricao.telefone.replace(/\D/g, "")}`}
                        className="hover:text-primary"
                      >
                        {inscricao.telefone}
                      </a>
                    </td>
                    <td className="px-5 py-4 align-top text-foreground/70">
                      {inscricao.frequenta_igreja ? (inscricao.igreja ?? "Sim") : "Não frequenta"}
                    </td>
                    <td className="px-5 py-4 align-top">
                      <span className="tracking-[0.12em] text-primary">{inscricao.codigo}</span>
                      <br />
                      <span className="text-xs text-foreground/50">
                        {inscricao.email_enviado_em ? "E-mail enviado" : "E-mail não enviado"}
                      </span>
                      {/* Atalhos para mandar o ingresso na mao: abrem o
                        WhatsApp e o programa de e-mail com tudo escrito. */}
                      <span className="mt-2 flex gap-3 text-xs">
                        <a
                          href={linkWhatsapp(inscricao)}
                          target="_blank"
                          rel="noopener"
                          className="text-primary underline underline-offset-4 hover:opacity-80"
                        >
                          WhatsApp
                        </a>
                        <a
                          href={linkEmail(inscricao)}
                          className="text-primary underline underline-offset-4 hover:opacity-80"
                        >
                          E-mail
                        </a>
                      </span>
                    </td>
                    <td className="px-5 py-4 align-top">
                      <button
                        type="button"
                        onClick={() => void alternarPresenca(inscricao)}
                        className={`min-h-[38px] rounded-full border px-4 text-xs uppercase tracking-[0.14em] transition-colors ${
                          inscricao.checkin_em
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-primary/20 text-primary/70 hover:border-primary/50"
                        }`}
                      >
                        {inscricao.checkin_em ? "Presente" : "Marcar presença"}
                      </button>
                      {inscricao.checkin_em && (
                        <span className="mt-1 block text-xs text-foreground/50">
                          {formatarData(inscricao.checkin_em)}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
