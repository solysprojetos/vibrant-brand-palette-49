import { useCallback, useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { ENDPOINT_PAINEL } from "@/config/conteudo";

/**
 * Baixa da presenca pela camera do celular.
 *
 * O QR code do ingresso guarda o endereco desta pagina com o codigo junto
 * (/checkin?c=MC-XXXX-XXXX). Apontar a camera do celular — a nativa mesmo,
 * sem aplicativo nenhum — abre aqui e a presenca e marcada na hora.
 *
 * A senha do painel e pedida uma vez e fica guardada no proprio aparelho, para
 * a fila da entrada nao parar a cada leitura. "Sair" apaga.
 */

const CHAVE_SENHA = "mc-painel-senha";

const CAMPO =
  "w-full rounded-full border border-primary/20 bg-background px-6 py-3 text-base text-foreground outline-none transition-all placeholder:text-foreground/40 focus:border-primary focus:ring-2 focus:ring-[color:var(--rose-soft)]";

type Estado =
  | { fase: "abrindo" }
  | { fase: "pedindo-senha" }
  | { fase: "conferindo" }
  | { fase: "confirmado"; nome: string; jaEstava: boolean }
  | { fase: "erro"; mensagem: string };

/** Guarda a senha no aparelho, mas nunca quebra se o navegador nao deixar. */
function lerSenhaGuardada(): string {
  try {
    return localStorage.getItem(CHAVE_SENHA) ?? "";
  } catch {
    return "";
  }
}

function guardarSenha(senha: string): void {
  try {
    localStorage.setItem(CHAVE_SENHA, senha);
  } catch {
    // Navegador com armazenamento bloqueado: a senha vale so para esta leitura.
  }
}

function esquecerSenha(): void {
  try {
    localStorage.removeItem(CHAVE_SENHA);
  } catch {
    // Nada a fazer.
  }
}

export const Route = createFileRoute("/checkin")({
  component: Checkin,
  validateSearch: (busca: Record<string, unknown>) => ({
    c: typeof busca.c === "string" ? busca.c : "",
  }),
  head: () => ({
    meta: [
      { title: "Confirmar presença — Mulheres Curadas" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

function Checkin() {
  const { c: codigo } = Route.useSearch();
  const [senha, setSenha] = useState("");
  // Comeca em "abrindo": o HTML pre-gerado nao conhece o codigo do ingresso,
  // que so existe na URL aberta pela camera. Decidir depois de montar evita
  // que a primeira pintura discorde do que o React monta em cima dela.
  const [estado, setEstado] = useState<Estado>({ fase: "abrindo" });

  const darBaixa = useCallback(
    async (senhaUsada: string) => {
      if (!codigo) {
        setEstado({ fase: "erro", mensagem: "Este link não traz nenhum código de ingresso." });
        return;
      }

      setEstado({ fase: "conferindo" });
      try {
        const resposta = await fetch(ENDPOINT_PAINEL, {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-senha": senhaUsada },
          body: JSON.stringify({ acao: "checkin", codigo }),
        }).catch(() => {
          throw new Error("Não conseguimos falar com o servidor. Verifique sua conexão.");
        });

        const dados = await resposta.json().catch(() => ({}));
        if (!resposta.ok) {
          if (resposta.status === 401) esquecerSenha();
          throw new Error(dados.erro ?? `Resposta ${resposta.status}`);
        }

        guardarSenha(senhaUsada);
        setEstado({
          fase: "confirmado",
          nome: dados.inscricao?.nome ?? "",
          jaEstava: Boolean(dados.jaEstava),
        });
      } catch (falha) {
        setEstado({
          fase: "erro",
          mensagem: falha instanceof Error ? falha.message : "Não foi possível confirmar.",
        });
      }
    },
    [codigo],
  );

  // Com a senha ja no aparelho, a leitura do QR confirma sozinha.
  useEffect(() => {
    const guardada = lerSenhaGuardada();
    if (guardada) {
      setSenha(guardada);
      void darBaixa(guardada);
    } else {
      setEstado({ fase: "pedindo-senha" });
    }
  }, [darBaixa]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 py-12 text-foreground">
      <div className="w-full max-w-sm text-center">
        <p translate="no" className="eyebrow text-primary/80">
          Mulheres Curadas
        </p>

        {(estado.fase === "conferindo" || estado.fase === "abrindo") && (
          <>
            <Loader2
              aria-hidden="true"
              className="mx-auto mt-8 h-10 w-10 animate-spin text-primary/70"
            />
            <p className="mt-6 text-base text-foreground/70">Confirmando a presença…</p>
          </>
        )}

        {estado.fase === "confirmado" && (
          <div role="status" aria-live="polite">
            <CheckCircle2 aria-hidden="true" className="mx-auto mt-8 h-14 w-14 text-primary" />
            <h1 className="mt-5 text-display text-3xl text-primary">
              {estado.jaEstava ? "Presença já registrada" : "Presença confirmada"}
            </h1>
            {estado.nome && <p className="mt-3 text-xl text-foreground">{estado.nome}</p>}
            <p className="mt-4 text-sm text-foreground/60">
              {estado.jaEstava
                ? "Este ingresso já tinha sido lido antes. Nada foi duplicado."
                : "Pode receber com um abraço. Aponte a câmera no próximo ingresso."}
            </p>
          </div>
        )}

        {estado.fase === "erro" && (
          <div role="alert">
            <XCircle aria-hidden="true" className="mx-auto mt-8 h-14 w-14 text-destructive/80" />
            <h1 className="mt-5 text-display text-3xl text-primary">Não deu certo</h1>
            <p className="mt-4 text-sm leading-relaxed text-destructive">{estado.mensagem}</p>
            <button
              type="button"
              onClick={() => setEstado({ fase: "pedindo-senha" })}
              className="mt-6 min-h-[44px] rounded-full border border-primary/20 px-6 text-xs uppercase tracking-[0.2em] text-primary transition-colors hover:border-primary/50"
            >
              Tentar de novo
            </button>
          </div>
        )}

        {estado.fase === "pedindo-senha" && (
          <form
            onSubmit={(evento) => {
              evento.preventDefault();
              void darBaixa(senha);
            }}
          >
            <h1 className="mt-4 text-display text-3xl text-primary">Confirmar presença</h1>
            <p className="mt-3 text-sm text-foreground/60">
              {codigo ? (
                <>
                  Ingresso <span className="tracking-[0.12em] text-primary">{codigo}</span>
                </>
              ) : (
                "Abra esta página lendo o QR code do ingresso."
              )}
            </p>
            <label htmlFor="senha" className="sr-only">
              Senha do painel
            </label>
            <input
              id="senha"
              type="password"
              autoComplete="current-password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className={`${CAMPO} mt-6 text-center`}
              placeholder="Senha do painel"
            />
            <button
              type="submit"
              disabled={!senha || !codigo}
              className="mt-4 min-h-[44px] w-full rounded-full bg-primary px-6 text-xs uppercase tracking-[0.25em] text-primary-foreground transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
            >
              Confirmar
            </button>
            <p className="mt-4 text-xs leading-relaxed text-foreground/50">
              A senha fica guardada neste aparelho, então as próximas leituras confirmam sozinhas.
            </p>
          </form>
        )}

        <Link
          to="/painel"
          className="mt-10 inline-flex min-h-[44px] items-center text-xs uppercase tracking-[0.25em] text-primary/70 transition-colors hover:text-primary"
        >
          Ver a lista de inscrições
        </Link>
      </div>
    </div>
  );
}
