import { useId, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { CheckCircle2, Loader2, MailOpen } from "lucide-react";
import { ENDPOINT_INSCRICAO, SITE_URL, contato } from "@/config/conteudo";

/**
 * Formulario de inscricao.
 *
 * Campos: nome completo (guardado em maiusculas), telefone (so digitos, com
 * mascara), e-mail, se frequenta igreja e, quando sim, o nome dela.
 *
 * A integracao segue a mesma: sem ENDPOINT_INSCRICAO configurado, a inscricao
 * sai por e-mail para contato@mulherescuradas.com. Em volta ficam a validacao,
 * o estado de envio, as mensagens de retorno, a trava contra envio repetido e
 * o consentimento LGPD.
 */

const CAMPO =
  "mt-2 w-full rounded-full border border-primary/20 bg-background px-6 py-3 text-base text-foreground outline-none transition-all placeholder:text-foreground/40 focus:border-primary focus:ring-2 focus:ring-[color:var(--rose-soft)]";

const CAMPO_INVALIDO = "border-destructive/60 focus:border-destructive";

/** (11) 90000-0000 — aceita fixo de 10 digitos e celular de 11. */
export function mascaraTelefone(valor: string): string {
  const d = valor.replace(/\D/g, "").slice(0, 11);
  if (!d) return "";
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

/**
 * Nome sempre em maiusculas, como a organizacao pede para a lista de presenca.
 * O locale pt-BR trata os acentos: "joão" vira "JOÃO", nao "JOAO".
 */
export function maiusculas(valor: string): string {
  return valor.toLocaleUpperCase("pt-BR");
}

export function emailValido(valor: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(valor.trim());
}

type Erros = Partial<
  Record<"nome" | "telefone" | "email" | "igreja" | "nomeIgreja" | "consentimento", string>
>;

/** Vazio enquanto a visitante nao responde: assim nada vem marcado por padrao. */
type Igreja = "" | "sim" | "nao";

function validar(dados: {
  nome: string;
  telefone: string;
  email: string;
  igreja: Igreja;
  nomeIgreja: string;
  consentimento: boolean;
}): Erros {
  const erros: Erros = {};

  if (dados.nome.trim().length < 3) erros.nome = "Por favor, escreva seu nome completo.";

  const digitos = dados.telefone.replace(/\D/g, "");
  if (digitos.length < 10) erros.telefone = "Informe o DDD e o número, como (11) 90000-0000.";

  if (!emailValido(dados.email)) erros.email = "Confira seu e-mail: parece faltar algo.";

  if (!dados.igreja) erros.igreja = "Escolha uma das opções.";

  if (dados.igreja === "sim" && dados.nomeIgreja.trim().length < 2)
    erros.nomeIgreja = "Escreva o nome da sua igreja.";

  if (!dados.consentimento)
    erros.consentimento = "Precisamos da sua autorização para entrar em contato.";

  return erros;
}

type Estado = "parado" | "enviando" | "enviado" | "erro";

export function FormularioInscricao() {
  const id = useId();
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [igreja, setIgreja] = useState<Igreja>("");
  const [nomeIgreja, setNomeIgreja] = useState("");
  const [consentimento, setConsentimento] = useState(false);
  const [erros, setErros] = useState<Erros>({});
  const [estado, setEstado] = useState<Estado>("parado");
  // Codigo do ingresso devolvido pela inscricao: com ele a visitante ja leva o
  // QR na tela, sem depender do e-mail chegar.
  const [codigo, setCodigo] = useState("");
  // Guarda o mailto do ultimo envio, para a visitante poder abrir de novo
  // caso o aplicativo de e-mail nao tenha aberto na primeira vez.
  const ultimoMailto = useRef("");
  // Trava sincrona: o clique duplo chega antes do React re-renderizar o botao.
  const enviando = useRef(false);

  const enviarPorEmail = (dados: {
    nome: string;
    telefone: string;
    email: string;
    igreja: Igreja;
    nomeIgreja: string;
  }) => {
    const corpo = [
      `Nome: ${dados.nome}`,
      `Telefone: ${dados.telefone}`,
      `E-mail: ${dados.email}`,
      `Frequenta igreja: ${dados.igreja === "sim" ? "Sim" : "Não"}`,
      ...(dados.igreja === "sim" ? [`Igreja: ${dados.nomeIgreja}`] : []),
      "",
      "Autorizo o uso dos meus dados exclusivamente para contato e organização dos encontros Mulheres Curadas.",
    ].join("\n");

    const link = `mailto:${contato.email}?subject=${encodeURIComponent(
      "Nova inscrição Mulheres Curadas",
    )}&body=${encodeURIComponent(corpo)}`;

    ultimoMailto.current = link;
    window.location.href = link;
  };

  const aoEnviar = async (evento: React.FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    if (enviando.current || estado === "enviando" || estado === "enviado") return;

    const dados = {
      nome: nome.trim(),
      telefone: telefone.trim(),
      email: email.trim(),
      igreja,
      nomeIgreja: igreja === "sim" ? nomeIgreja.trim() : "",
      consentimento,
    };
    const encontrados = validar(dados);
    setErros(encontrados);

    if (Object.keys(encontrados).length > 0) {
      const primeiro = document.getElementById(`${id}-${Object.keys(encontrados)[0]}`);
      primeiro?.focus();
      return;
    }

    enviando.current = true;
    setEstado("enviando");

    try {
      if (ENDPOINT_INSCRICAO) {
        // O corpo e JSON, mas o cabecalho vai como text/plain de proposito:
        // com application/json o navegador manda antes um OPTIONS de
        // verificacao, que o Apps Script nao responde — e a inscricao falharia
        // sem nunca chegar la. Como text/plain o envio e direto. Quem le do
        // outro lado ja trata o corpo como JSON.
        const resposta = await fetch(ENDPOINT_INSCRICAO, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify({
            nome: dados.nome,
            telefone: dados.telefone,
            email: dados.email,
            frequentaIgreja: dados.igreja === "sim",
            igreja: dados.nomeIgreja,
            consentimento: true,
            origem: "site Mulheres Curadas",
          }),
        });
        if (!resposta.ok) throw new Error(`Resposta ${resposta.status}`);
        const retorno = await resposta.json().catch(() => ({}));
        if (typeof retorno.codigo === "string") setCodigo(retorno.codigo);
      } else {
        enviarPorEmail(dados);
      }

      setEstado("enviado");
    } catch (erro) {
      console.error(erro);
      setEstado("erro");
    } finally {
      enviando.current = false;
    }
  };

  const recomecar = () => {
    setNome("");
    setTelefone("");
    setEmail("");
    setIgreja("");
    setNomeIgreja("");
    setConsentimento(false);
    setErros({});
    setCodigo("");
    setEstado("parado");
  };

  if (estado === "enviado") {
    // O nome fica em maiusculas no cadastro, mas na saudacao soaria como grito:
    // aqui ele volta com so a inicial maiuscula.
    const bruto = nome.trim().split(/\s+/)[0] ?? "";
    const primeiroNome = bruto ? bruto[0] + bruto.slice(1).toLocaleLowerCase("pt-BR") : "";

    return (
      <div className="mt-8 text-center" role="status" aria-live="polite">
        {ENDPOINT_INSCRICAO ? (
          <>
            <CheckCircle2 aria-hidden="true" className="mx-auto h-10 w-10 text-primary/80" />
            <h4 className="mt-5 text-display text-3xl text-primary">
              Inscrição realizada com <span className="italic">sucesso.</span>
            </h4>
            <p className="mt-4 text-base leading-relaxed text-foreground/70">
              Que alegria ter você com a gente{primeiroNome ? `, ${primeiroNome}` : ""}! Este é o QR
              code que confirma sua presença no dia do encontro.
            </p>

            {/* O QR aparece aqui na hora, e nao so no e-mail: assim a visitante
              ja sai com o ingresso, mesmo que a mensagem demore ou caia no
              spam. E a mesma imagem que vai por e-mail. */}
            {codigo && (
              <>
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=600x600&margin=12&data=${encodeURIComponent(
                    `${SITE_URL}/checkin/?c=${codigo}`,
                  )}`}
                  alt={`QR code do seu ingresso: ${codigo}`}
                  width={220}
                  height={220}
                  className="mx-auto mt-6 rounded-2xl border border-primary/10"
                />
                <p className="mt-3 text-lg tracking-[0.18em] text-primary">{codigo}</p>
                <p className="mt-2 text-sm leading-relaxed text-foreground/60">
                  Tire um print desta tela ou salve a imagem. Também enviamos tudo para o seu e-mail
                  — se não encontrar, basta apresentar este código na entrada.
                </p>
              </>
            )}
          </>
        ) : (
          <>
            <MailOpen aria-hidden="true" className="mx-auto h-10 w-10 text-primary/80" />
            <h4 className="mt-5 text-display text-3xl text-primary">
              Falta só <span className="italic">um toque.</span>
            </h4>
            <p className="mt-4 text-base leading-relaxed text-foreground/70">
              Abrimos seu aplicativo de e-mail com a inscrição já preenchida
              {primeiroNome ? `, ${primeiroNome}` : ""}. Toque em <strong>enviar</strong> por lá
              para garantir sua vaga.
            </p>
            <a
              href={ultimoMailto.current}
              className="mt-5 inline-flex min-h-[44px] items-center text-sm text-primary underline underline-offset-4 transition-opacity hover:opacity-80"
            >
              Não abriu? Abrir o e-mail novamente
            </a>
          </>
        )}

        <button
          type="button"
          onClick={recomecar}
          className="mt-6 inline-flex min-h-[44px] items-center text-xs uppercase tracking-[0.25em] text-primary/80 underline-offset-8 transition-colors hover:text-primary hover:underline"
        >
          Fazer outra inscrição
        </button>
      </div>
    );
  }

  const ocupado = estado === "enviando";

  return (
    <form className="mt-8 space-y-5" onSubmit={aoEnviar} noValidate>
      <div>
        <label htmlFor={`${id}-nome`} className="eyebrow text-primary/80">
          Nome completo
        </label>
        <input
          id={`${id}-nome`}
          name="nome"
          type="text"
          required
          maxLength={100}
          autoComplete="name"
          value={nome}
          onChange={(e) => setNome(maiusculas(e.target.value))}
          disabled={ocupado}
          aria-invalid={Boolean(erros.nome)}
          aria-describedby={erros.nome ? `${id}-nome-erro` : undefined}
          className={`${CAMPO} ${erros.nome ? CAMPO_INVALIDO : ""}`}
          placeholder="SEU NOME COMPLETO"
        />
        {erros.nome && (
          <p id={`${id}-nome-erro`} className="mt-2 pl-6 text-sm text-destructive">
            {erros.nome}
          </p>
        )}
      </div>

      <div>
        <label htmlFor={`${id}-telefone`} className="eyebrow text-primary/80">
          Telefone
        </label>
        <input
          id={`${id}-telefone`}
          name="telefone"
          type="tel"
          required
          inputMode="tel"
          maxLength={16}
          autoComplete="tel"
          value={telefone}
          onChange={(e) => setTelefone(mascaraTelefone(e.target.value))}
          disabled={ocupado}
          aria-invalid={Boolean(erros.telefone)}
          aria-describedby={erros.telefone ? `${id}-telefone-erro` : undefined}
          className={`${CAMPO} ${erros.telefone ? CAMPO_INVALIDO : ""}`}
          placeholder="(00) 00000-0000"
        />
        {erros.telefone && (
          <p id={`${id}-telefone-erro`} className="mt-2 pl-6 text-sm text-destructive">
            {erros.telefone}
          </p>
        )}
      </div>

      <div>
        <label htmlFor={`${id}-email`} className="eyebrow text-primary/80">
          E-mail
        </label>
        <input
          id={`${id}-email`}
          name="email"
          type="email"
          required
          maxLength={255}
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={ocupado}
          aria-invalid={Boolean(erros.email)}
          aria-describedby={erros.email ? `${id}-email-erro` : undefined}
          className={`${CAMPO} ${erros.email ? CAMPO_INVALIDO : ""}`}
          placeholder="voce@email.com"
        />
        {erros.email && (
          <p id={`${id}-email-erro`} className="mt-2 pl-6 text-sm text-destructive">
            {erros.email}
          </p>
        )}
      </div>

      {/* Vinculo com igreja. O <fieldset> agrupa as duas opcoes para o leitor de
        tela anunciar a pergunta junto de cada alternativa. O campo com o nome
        da igreja so aparece — e so e exigido — depois do "sim". */}
      <fieldset>
        <legend className="eyebrow text-primary/80">Você frequenta alguma igreja?</legend>
        <div
          id={`${id}-igreja`}
          tabIndex={-1}
          className="mt-3 flex gap-3"
          aria-describedby={erros.igreja ? `${id}-igreja-erro` : undefined}
        >
          {(
            [
              ["sim", "Sim"],
              ["nao", "Não"],
            ] as const
          ).map(([valor, rotulo]) => (
            <label
              key={valor}
              className={`flex min-h-[44px] flex-1 cursor-pointer items-center justify-center gap-2 rounded-full border px-6 text-sm transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[color:var(--rose-soft)] ${
                igreja === valor
                  ? "border-primary bg-primary text-primary-foreground"
                  : `bg-background text-foreground/70 hover:border-primary/40 ${
                      erros.igreja ? "border-destructive/60" : "border-primary/20"
                    }`
              }`}
            >
              <input
                type="radio"
                name="igreja"
                value={valor}
                checked={igreja === valor}
                onChange={() => setIgreja(valor)}
                disabled={ocupado}
                className="sr-only"
              />
              {rotulo}
            </label>
          ))}
        </div>
        {erros.igreja && (
          <p id={`${id}-igreja-erro`} className="mt-2 pl-6 text-sm text-destructive">
            {erros.igreja}
          </p>
        )}
      </fieldset>

      {igreja === "sim" && (
        <div>
          <label htmlFor={`${id}-nomeIgreja`} className="eyebrow text-primary/80">
            Qual o nome da igreja?
          </label>
          <input
            id={`${id}-nomeIgreja`}
            name="nomeIgreja"
            type="text"
            required
            maxLength={100}
            value={nomeIgreja}
            onChange={(e) => setNomeIgreja(e.target.value)}
            disabled={ocupado}
            aria-invalid={Boolean(erros.nomeIgreja)}
            aria-describedby={erros.nomeIgreja ? `${id}-nomeIgreja-erro` : undefined}
            className={`${CAMPO} ${erros.nomeIgreja ? CAMPO_INVALIDO : ""}`}
            placeholder="Nome da sua igreja"
          />
          {erros.nomeIgreja && (
            <p id={`${id}-nomeIgreja-erro`} className="mt-2 pl-6 text-sm text-destructive">
              {erros.nomeIgreja}
            </p>
          )}
        </div>
      )}

      <div className="pt-1">
        <div className="flex items-start gap-3">
          <input
            id={`${id}-consentimento`}
            name="consentimento"
            type="checkbox"
            required
            checked={consentimento}
            onChange={(e) => setConsentimento(e.target.checked)}
            disabled={ocupado}
            aria-invalid={Boolean(erros.consentimento)}
            aria-describedby={erros.consentimento ? `${id}-consentimento-erro` : undefined}
            className="mt-1 h-4 w-4 shrink-0 rounded border-primary/30 accent-[color:var(--clay)]"
          />
          <label
            htmlFor={`${id}-consentimento`}
            className="text-sm leading-relaxed text-foreground/70"
          >
            Autorizo o uso dos meus dados exclusivamente para contato e organização dos encontros
            Mulheres Curadas.{" "}
            <Link
              to="/politica-de-privacidade"
              target="_blank"
              rel="noopener"
              className="text-primary underline underline-offset-4 transition-opacity hover:opacity-80"
            >
              Política de Privacidade
            </Link>
            .
          </label>
        </div>
        {erros.consentimento && (
          <p id={`${id}-consentimento-erro`} className="mt-2 pl-7 text-sm text-destructive">
            {erros.consentimento}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={ocupado}
        className="mt-4 flex min-h-[44px] w-full items-center justify-center gap-3 rounded-full bg-primary px-6 py-4 text-[0.68rem] sm:px-10 sm:text-xs uppercase tracking-[0.16em] sm:tracking-[0.3em] text-primary-foreground transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {ocupado && <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />}
        {ocupado ? "Enviando" : "Garantir minha vaga"}
      </button>

      <p role="status" aria-live="polite" className="sr-only">
        {ocupado ? "Enviando sua inscrição, aguarde." : ""}
      </p>

      {estado === "erro" && (
        <p
          role="alert"
          className="rounded-2xl bg-destructive/10 px-6 py-4 text-sm leading-relaxed text-destructive"
        >
          Não conseguimos concluir sua inscrição agora. Tente novamente em alguns instantes ou
          escreva para{" "}
          <a href={`mailto:${contato.email}`} className="underline underline-offset-4">
            {contato.email}
          </a>
          .
        </p>
      )}
    </form>
  );
}
