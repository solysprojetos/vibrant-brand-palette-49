import { useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Instagram, Loader2, Mail, MapPin, MessageCircle } from "lucide-react";
import { SITE_URL } from "@/config/conteudo";
import { supabase } from "@/lib/supabase";
import { useConteudoSite } from "@/lib/cms/consultas";
import { linkWhatsapp, traduzirErro } from "@/lib/cms/util";
import { AberturaPagina, PaginaInterna } from "@/components/site/estrutura";

const DESCRICAO =
  "Fale com o Mulheres Curadas: Instagram, WhatsApp, e-mail e formulário de contato.";

export const Route = createFileRoute("/contato")({
  component: PaginaContato,
  head: () => ({
    meta: [
      { title: "Contato — Mulheres Curadas" },
      { name: "description", content: DESCRICAO },
      { property: "og:title", content: "Contato — Mulheres Curadas" },
      { property: "og:description", content: DESCRICAO },
      { property: "og:url", content: `${SITE_URL}/contato/` },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/contato/` }],
  }),
});

const CAMPO =
  "w-full rounded-2xl border border-primary/15 bg-background px-5 py-3.5 text-base text-foreground outline-none transition placeholder:text-foreground/40 focus:border-primary focus:ring-2 focus:ring-[color:var(--rose-soft)]";

function PaginaContato() {
  const { data } = useConteudoSite();
  const c = data!.contato;
  const whatsapp = linkWhatsapp(c.whatsapp, "Olá! Vim pelo site do Mulheres Curadas.");
  const mapa =
    c.mapa_url ||
    (c.endereco
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(c.endereco)}`
      : "");

  const canais = [
    c.instagram && {
      icone: Instagram,
      rotulo: "Instagram oficial",
      valor: c.instagram.replace(/^https?:\/\/(www\.)?instagram\.com\//, "@").replace(/\/$/, ""),
      href: c.instagram,
    },
    whatsapp && {
      icone: MessageCircle,
      rotulo: "WhatsApp",
      valor: c.whatsapp_texto || "Enviar mensagem",
      href: whatsapp,
    },
    c.email && { icone: Mail, rotulo: "E-mail", valor: c.email, href: `mailto:${c.email}` },
    c.endereco && { icone: MapPin, rotulo: "Endereço", valor: c.endereco, href: mapa },
  ].filter(Boolean) as { icone: typeof Mail; rotulo: string; valor: string; href: string }[];

  return (
    <PaginaInterna>
      <AberturaPagina
        selo="Contato"
        titulo="Vamos"
        enfase="conversar?"
        texto="Dúvidas, pedidos de oração, parcerias ou um abraço em forma de mensagem — escreva para nós."
      />
      <section className="mx-auto grid max-w-6xl gap-10 px-6 md:grid-cols-12 md:px-12">
        <ul className="space-y-4 md:col-span-5">
          {canais.map(({ icone: Icone, rotulo, valor, href }) => (
            <li key={rotulo}>
              <a
                href={href}
                target={href.startsWith("http") ? "_blank" : undefined}
                rel="noopener noreferrer"
                className="flex items-center gap-5 rounded-3xl bg-card p-6 shadow-sm ring-1 ring-primary/5 transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[color:color-mix(in_oklch,var(--rose-soft)_18%,var(--cream))] text-primary">
                  <Icone className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="eyebrow block text-[0.6rem] text-primary/60">{rotulo}</span>
                  <span className="mt-1 block break-words text-foreground/85">{valor}</span>
                </span>
              </a>
            </li>
          ))}
        </ul>
        <div className="md:col-span-7">
          <Formulario />
        </div>
      </section>
    </PaginaInterna>
  );
}

function Formulario() {
  const [form, setForm] = useState({
    nome: "",
    email: "",
    telefone: "",
    assunto: "",
    mensagem: "",
    site: "",
  });
  const [estado, setEstado] = useState<"livre" | "enviando" | "enviado">("livre");
  const [erro, setErro] = useState("");

  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    // Campo invisivel: robo preenche, gente nao.
    if (form.site) return setEstado("enviado");
    if (form.nome.trim().length < 2) return setErro("Conte seu nome, por favor.");
    if (!/^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(form.email.trim()))
      return setErro("Confira o e-mail.");
    if (form.mensagem.trim().length < 5) return setErro("Escreva sua mensagem.");
    setErro("");
    setEstado("enviando");
    const { error } = await supabase()
      .from("mc_contatos")
      .insert({
        nome: form.nome.trim().slice(0, 120),
        email: form.email.trim().slice(0, 160),
        telefone: form.telefone.trim().slice(0, 30),
        assunto: form.assunto.trim().slice(0, 160),
        mensagem: form.mensagem.trim().slice(0, 4000),
      });
    if (error) {
      setErro(traduzirErro(error));
      setEstado("livre");
      return;
    }
    setEstado("enviado");
  };

  if (estado === "enviado") {
    return (
      <div
        className="flex h-full flex-col items-center justify-center rounded-[2rem] bg-card p-12 text-center shadow-sm ring-1 ring-primary/5 animate-in fade-in zoom-in-95 duration-500"
        role="status"
      >
        <CheckCircle2 className="h-12 w-12 text-primary" aria-hidden="true" />
        <p className="mt-5 text-display text-4xl text-primary">Mensagem recebida!</p>
        <p className="mt-3 max-w-sm text-foreground/70">
          Obrigada por escrever. Em breve alguém da nossa equipe responde você.
        </p>
      </div>
    );
  }

  const muda = (campo: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm({ ...form, [campo]: e.target.value });

  return (
    <form
      onSubmit={enviar}
      noValidate
      className="space-y-4 rounded-[2rem] bg-card p-6 shadow-sm ring-1 ring-primary/5 md:p-10"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-sm text-foreground/75">Nome</span>
          <input
            className={CAMPO}
            value={form.nome}
            onChange={muda("nome")}
            autoComplete="name"
            required
            maxLength={120}
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm text-foreground/75">E-mail</span>
          <input
            type="email"
            className={CAMPO}
            value={form.email}
            onChange={muda("email")}
            autoComplete="email"
            required
            maxLength={160}
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm text-foreground/75">WhatsApp (opcional)</span>
          <input
            type="tel"
            className={CAMPO}
            value={form.telefone}
            onChange={muda("telefone")}
            autoComplete="tel"
            maxLength={30}
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm text-foreground/75">Assunto</span>
          <input
            className={CAMPO}
            value={form.assunto}
            onChange={muda("assunto")}
            maxLength={160}
          />
        </label>
      </div>
      <label className="block">
        <span className="mb-1.5 block text-sm text-foreground/75">Mensagem</span>
        <textarea
          rows={6}
          className={CAMPO}
          value={form.mensagem}
          onChange={muda("mensagem")}
          required
          maxLength={4000}
        />
      </label>
      <label className="sr-only" aria-hidden="true">
        Não preencha
        <input tabIndex={-1} autoComplete="off" value={form.site} onChange={muda("site")} />
      </label>
      {erro && (
        <p role="alert" className="text-sm text-destructive">
          {erro}
        </p>
      )}
      <button
        type="submit"
        disabled={estado === "enviando"}
        className="flex min-h-[52px] w-full items-center justify-center gap-3 rounded-full bg-primary px-8 text-xs uppercase tracking-[0.25em] text-primary-foreground transition hover:opacity-90 disabled:opacity-70"
      >
        {estado === "enviando" && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
        {estado === "enviando" ? "Enviando" : "Enviar mensagem"}
      </button>
      <p className="text-center text-xs text-foreground/55">
        Seus dados são usados só para responder você.
      </p>
    </form>
  );
}
