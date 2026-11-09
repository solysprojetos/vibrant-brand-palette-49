import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  CalendarHeart,
  ClipboardList,
  ExternalLink,
  FileText,
  Gift,
  Images,
  LayoutGrid,
  Loader2,
  LogOut,
  Menu,
  QrCode,
  MessageSquareHeart,
  ShieldCheck,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { assetUrl } from "@/lib/asset-url";
import { supabase } from "@/lib/supabase";
import { traduzirErro } from "@/lib/cms/util";
import { ROTULO_PAPEL, type Acesso } from "@/lib/cms/tipos";
import logoMonogram from "@/assets/logo-monogram-v2.asset.json";
import logoWordmark from "@/assets/logo-wordmark-v2.asset.json";
import { ProvedorSessao, useSessao } from "./sessao";
import { BOTAO_PRIMARIO, CAMPO, Campo } from "./ui";

type ItemMenu = {
  para: string;
  rotulo: string;
  icone: typeof LayoutGrid;
  /** Papeis que veem o item. */
  papeis: Acesso["papel"][];
  externo?: boolean;
};

const EQUIPE: Acesso["papel"][] = ["admin", "editor"];

const MENU: ItemMenu[] = [
  { para: "/admin", rotulo: "Dashboard", icone: LayoutGrid, papeis: EQUIPE },
  {
    para: "/admin/checkin",
    rotulo: "Check-in da entrada",
    icone: QrCode,
    papeis: ["admin", "editor", "recepcao"],
  },
  { para: "/admin/eventos", rotulo: "Eventos", icone: CalendarHeart, papeis: EQUIPE },
  { para: "/admin/galeria", rotulo: "Galeria de fotos", icone: Images, papeis: EQUIPE },
  {
    para: "/admin/mensagens",
    rotulo: "Mensagens e testemunhos",
    icone: MessageSquareHeart,
    papeis: EQUIPE,
  },
  { para: "/admin/conteudo", rotulo: "Conteúdo do site", icone: FileText, papeis: EQUIPE },
  { para: "/admin/equipe", rotulo: "Equipe", icone: Users, papeis: EQUIPE },
  { para: "/admin/inscricoes", rotulo: "Inscrições", icone: ClipboardList, papeis: EQUIPE },
  { para: "/admin/sorteio", rotulo: "Sorteio", icone: Gift, papeis: EQUIPE },
  { para: "/admin/usuarios", rotulo: "Usuários e acesso", icone: ShieldCheck, papeis: ["admin"] },
];

function Marca({ claro = true }: { claro?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <img
        src={assetUrl(logoMonogram.url)}
        alt=""
        aria-hidden="true"
        width={349}
        height={522}
        className={`h-11 w-auto ${claro ? "brightness-0 invert" : ""}`}
      />
      <img
        src={assetUrl(logoWordmark.url)}
        alt="Mulheres Curadas"
        width={746}
        height={266}
        className={`h-8 w-auto ${claro ? "brightness-0 invert" : ""}`}
      />
    </div>
  );
}

function BarraLateral({ aoNavegar }: { aoNavegar?: () => void }) {
  const { acesso, sair } = useSessao();
  const caminho = useRouterState({ select: (s) => s.location.pathname }).replace(/\/+$/, "") || "/";
  const [contaAberta, setContaAberta] = useState(false);

  const ativo = (para: string) =>
    para === "/admin"
      ? /\/admin$/.test(caminho)
      : caminho.endsWith(para) || caminho.includes(`${para}/`);

  const nome = acesso?.nome || acesso?.email || "Equipe";
  const inicial = nome.trim()[0]?.toUpperCase() ?? "M";

  return (
    <div className="admin-barra flex h-full flex-col text-white">
      <div className="px-6 pt-8 pb-7">
        <Marca />
        <p className="mt-4 text-[0.62rem] font-semibold uppercase tracking-[0.32em] text-white/70">
          Painel administrativo
        </p>
      </div>

      <nav aria-label="Seções do painel" className="flex-1 overflow-y-auto px-3">
        <ul className="space-y-1">
          {MENU.filter((item) => acesso && item.papeis.includes(acesso.papel)).map((item) => {
            const Icone = item.icone;
            const marcado = !item.externo && ativo(item.para);
            return (
              <li key={item.rotulo}>
                <Link
                  to={item.para}
                  onClick={aoNavegar}
                  aria-current={marcado ? "page" : undefined}
                  className={`flex min-h-[44px] items-center gap-3 rounded-2xl px-4 text-[15px] transition ${
                    marcado
                      ? "bg-white/15 font-semibold text-white shadow-[inset_0_0_0_1px_rgb(255_255_255/0.08)]"
                      : "text-white/80 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Icone className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
                  <span className="flex-1 truncate">{item.rotulo}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-white/10 px-3 pt-4 pb-5">
        <Link
          to="/"
          target="_blank"
          className="flex min-h-[44px] items-center gap-3 rounded-2xl px-4 text-[15px] text-white/80 transition hover:bg-white/10 hover:text-white"
        >
          <ExternalLink className="h-[18px] w-[18px]" aria-hidden="true" />
          Ver site
        </Link>
        <div className="mt-3 flex items-center gap-3 px-3">
          <button
            type="button"
            onClick={() => setContaAberta(true)}
            className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl py-1 text-left transition hover:opacity-90"
            title="Minha conta"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/15 font-semibold ring-2 ring-white/20">
              {inicial}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold">{nome}</span>
              <span className="block text-[0.62rem] uppercase tracking-[0.22em] text-white/60">
                {acesso ? ROTULO_PAPEL[acesso.papel] : ""}
              </span>
            </span>
          </button>
          <button
            type="button"
            onClick={() => void sair()}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-white/75 transition hover:bg-white/10 hover:text-white"
            aria-label="Sair do painel"
            title="Sair"
          >
            <LogOut className="h-[18px] w-[18px]" aria-hidden="true" />
          </button>
        </div>
      </div>
      <MinhaConta aberta={contaAberta} aoFechar={() => setContaAberta(false)} />
    </div>
  );
}

function MinhaConta({ aberta, aoFechar }: { aberta: boolean; aoFechar: () => void }) {
  const { acesso, recarregarAcesso } = useSessao();
  const [nome, setNome] = useState(acesso?.nome ?? "");
  const [senha, setSenha] = useState("");
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (aberta) {
      setNome(acesso?.nome ?? "");
      setSenha("");
    }
  }, [aberta, acesso]);

  const salvar = async (e: FormEvent) => {
    e.preventDefault();
    if (senha && senha.length < 8) {
      toast.error("A nova senha precisa de pelo menos 8 caracteres.");
      return;
    }
    setSalvando(true);
    try {
      if (acesso && nome.trim() !== acesso.nome) {
        const { error } = await supabase()
          .from("mc_equipe_acesso")
          .update({ nome: nome.trim() })
          .eq("user_id", acesso.user_id);
        if (error) throw error;
      }
      if (senha) {
        const { error } = await supabase().auth.updateUser({ password: senha });
        if (error) throw error;
      }
      await recarregarAcesso();
      toast.success("Conta atualizada.");
      aoFechar();
    } catch (erro) {
      toast.error(traduzirErro(erro));
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Dialog open={aberta} onOpenChange={(v) => !v && aoFechar()}>
      <DialogContent className="admin-raiz rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-display text-3xl text-[color:var(--admin-vinho)]">
            Minha conta
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={salvar} className="space-y-4">
          <Campo rotulo="Como quer ser chamada" dica="Aparece na saudação do dashboard.">
            {(id) => (
              <input
                id={id}
                className={CAMPO}
                value={nome}
                onChange={(e) => setNome(e.target.value)}
              />
            )}
          </Campo>
          <Campo rotulo="E-mail de acesso">
            {(id) => <input id={id} className={CAMPO} value={acesso?.email ?? ""} disabled />}
          </Campo>
          <Campo rotulo="Nova senha" dica="Deixe em branco para manter a senha atual.">
            {(id) => (
              <input
                id={id}
                type="password"
                autoComplete="new-password"
                className={CAMPO}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
              />
            )}
          </Campo>
          <button type="submit" disabled={salvando} className={`${BOTAO_PRIMARIO} w-full`}>
            {salvando && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            Salvar
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function TelaCentral({ children }: { children: ReactNode }) {
  return (
    <div className="admin-raiz relative flex min-h-[100dvh] items-center justify-center overflow-hidden px-4 py-6 sm:px-5 sm:py-12">
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-0"
        style={{
          background:
            "radial-gradient(60% 50% at 85% 10%, rgb(180 26 64 / 0.10), transparent 70%), radial-gradient(50% 40% at 10% 90%, rgb(208 133 119 / 0.16), transparent 70%)",
        }}
      />
      <div className="admin-surgir relative w-full max-w-md rounded-[2rem] border border-[color:var(--admin-linha)] bg-white/90 px-5 py-7 shadow-[0_30px_80px_-30px_rgba(86,18,48,0.35)] backdrop-blur sm:p-8 md:p-10">
        <div className="flex justify-center">
          <Marca claro={false} />
        </div>
        <p className="mt-4 text-center text-[0.62rem] font-semibold uppercase tracking-[0.32em] text-primary/70">
          Painel administrativo
        </p>
        {children}
      </div>
    </div>
  );
}

function Entrar() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  const [modo, setModo] = useState<"entrar" | "esqueci">("entrar");

  const entrar = async (e: FormEvent) => {
    e.preventDefault();
    setEnviando(true);
    setErro("");
    const { error } = await supabase().auth.signInWithPassword({
      email: email.trim(),
      password: senha,
    });
    if (error) setErro(traduzirErro(error));
    setEnviando(false);
  };

  const recuperar = async (e: FormEvent) => {
    e.preventDefault();
    setEnviando(true);
    setErro("");
    const { error } = await supabase().auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}${import.meta.env.BASE_URL}admin/`,
    });
    setEnviando(false);
    if (error) setErro(traduzirErro(error));
    else {
      toast.success(
        "Se o e-mail tiver acesso, o link para criar uma nova senha chega em instantes.",
      );
      setModo("entrar");
    }
  };

  return (
    <TelaCentral>
      <h1 className="mt-6 text-center text-display text-[2rem] leading-tight text-[color:var(--admin-vinho)] sm:mt-8 sm:text-4xl">
        {modo === "entrar" ? "Bem-vinda de volta" : "Recuperar senha"}
      </h1>
      <p className="mt-2 text-center text-sm text-foreground/60">
        {modo === "entrar"
          ? "Entre com o e-mail e a senha da equipe."
          : "Enviaremos um link para você criar uma nova senha."}
      </p>
      <form onSubmit={modo === "entrar" ? entrar : recuperar} className="mt-6 space-y-4 sm:mt-8">
        <Campo rotulo="E-mail">
          {(id) => (
            <input
              id={id}
              type="email"
              inputMode="email"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              required
              autoComplete="email"
              className={CAMPO}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          )}
        </Campo>
        {modo === "entrar" && (
          <Campo rotulo="Senha">
            {(id) => (
              <input
                id={id}
                type="password"
                required
                autoComplete="current-password"
                className={CAMPO}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
              />
            )}
          </Campo>
        )}
        {erro && (
          <p
            role="alert"
            className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive"
          >
            {erro}
          </p>
        )}
        <button
          type="submit"
          disabled={enviando}
          className={`${BOTAO_PRIMARIO} min-h-[50px] w-full text-base sm:min-h-[44px] sm:text-sm`}
        >
          {enviando && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          {modo === "entrar" ? (enviando ? "Entrando" : "Entrar") : "Enviar link"}
        </button>
      </form>
      <div className="mt-6 flex flex-col items-center gap-2 text-sm">
        <button
          type="button"
          onClick={() => {
            setModo(modo === "entrar" ? "esqueci" : "entrar");
            setErro("");
          }}
          className="min-h-[44px] font-semibold text-primary underline-offset-4 hover:underline"
        >
          {modo === "entrar" ? "Esqueci minha senha" : "Voltar para o login"}
        </button>
        <Link to="/" className="text-foreground/55 transition hover:text-primary">
          ← Voltar ao site
        </Link>
      </div>
    </TelaCentral>
  );
}

function NovaSenha() {
  const { concluirRedefinicao } = useSessao();
  const [senha, setSenha] = useState("");
  const [enviando, setEnviando] = useState(false);

  const salvar = async (e: FormEvent) => {
    e.preventDefault();
    if (senha.length < 8) {
      toast.error("Use pelo menos 8 caracteres.");
      return;
    }
    setEnviando(true);
    const { error } = await supabase().auth.updateUser({ password: senha });
    setEnviando(false);
    if (error) toast.error(traduzirErro(error));
    else {
      toast.success("Senha criada. Bem-vinda!");
      concluirRedefinicao();
    }
  };

  return (
    <TelaCentral>
      <h1 className="mt-8 text-center text-display text-4xl text-[color:var(--admin-vinho)]">
        Nova senha
      </h1>
      <form onSubmit={salvar} className="mt-8 space-y-4">
        <Campo rotulo="Crie uma nova senha" dica="Mínimo de 8 caracteres.">
          {(id) => (
            <input
              id={id}
              type="password"
              autoComplete="new-password"
              className={CAMPO}
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
            />
          )}
        </Campo>
        <button type="submit" disabled={enviando} className={`${BOTAO_PRIMARIO} w-full`}>
          {enviando && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          Salvar senha
        </button>
      </form>
    </TelaCentral>
  );
}

function SemAcesso() {
  const { sessao, sair } = useSessao();
  return (
    <TelaCentral>
      <span className="mx-auto mt-8 flex h-14 w-14 items-center justify-center rounded-full bg-[color:var(--admin-rosado)] text-primary">
        <UserRound className="h-6 w-6" aria-hidden="true" />
      </span>
      <h1 className="mt-4 text-center text-display text-3xl text-[color:var(--admin-vinho)]">
        Acesso pendente
      </h1>
      <p className="mt-3 text-center text-sm leading-relaxed text-foreground/65">
        O login <strong>{sessao?.user.email}</strong> existe, mas ainda não tem permissão para o
        painel. Peça a uma administradora para liberar seu acesso em “Usuários e acesso”.
      </p>
      <button type="button" onClick={() => void sair()} className={`${BOTAO_PRIMARIO} mt-8 w-full`}>
        Sair
      </button>
    </TelaCentral>
  );
}

function Portao({ children }: { children: ReactNode }) {
  const { carregando, sessao, acesso, redefinindoSenha } = useSessao();
  const [gavetaAberta, setGavetaAberta] = useState(false);
  const caminho = useRouterState({ select: (s) => s.location.pathname });

  const navegar = useNavigate();
  // Fecha a gaveta do celular quando a pagina muda.
  useEffect(() => setGavetaAberta(false), [caminho]);

  // A recepcao so usa o check-in: qualquer outro endereco do painel leva para la.
  // (O banco tambem barra: a recepcao nao le nem altera nada alem disso.)
  const soCheckin = acesso?.papel === "recepcao" && !/\/admin\/checkin\/?$/.test(caminho);
  useEffect(() => {
    if (soCheckin) void navegar({ to: "/admin/checkin", replace: true });
  }, [soCheckin, navegar]);

  if (carregando) {
    return (
      <div className="admin-raiz flex min-h-screen items-center justify-center" role="status">
        <Loader2 className="h-7 w-7 animate-spin text-primary" aria-hidden="true" />
        <span className="sr-only">Carregando o painel</span>
      </div>
    );
  }
  if (redefinindoSenha && sessao) return <NovaSenha />;
  if (!sessao) return <Entrar />;
  if (!acesso) return <SemAcesso />;
  if (soCheckin) return null;

  return (
    <div className="admin-raiz min-h-screen lg:flex">
      {/* Computador: barra fixa */}
      <aside className="sticky top-0 hidden h-screen w-72 shrink-0 lg:block">
        <BarraLateral />
      </aside>

      {/* Celular e tablet: barra no topo + gaveta */}
      <header className="admin-barra sticky top-0 z-40 flex items-center justify-between px-4 py-3 text-white lg:hidden">
        <Marca />
        <button
          type="button"
          onClick={() => setGavetaAberta(true)}
          className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/10"
          aria-label="Abrir menu"
          aria-expanded={gavetaAberta}
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </button>
      </header>
      {gavetaAberta && (
        <div
          className="fixed inset-0 z-50 lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Menu do painel"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setGavetaAberta(false)}
            aria-label="Fechar menu"
          />
          <div className="admin-surgir absolute inset-y-0 left-0 w-[85%] max-w-xs shadow-2xl">
            <BarraLateral aoNavegar={() => setGavetaAberta(false)} />
            <button
              type="button"
              onClick={() => setGavetaAberta(false)}
              className="absolute top-4 right-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white"
              aria-label="Fechar menu"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}

      <main className="min-w-0 flex-1 px-4 py-8 sm:px-6 md:px-10 md:py-12">
        <div key={caminho} className="admin-surgir mx-auto max-w-6xl">
          {children}
        </div>
      </main>
    </div>
  );
}

export function EstruturaAdmin({ children }: { children: ReactNode }) {
  return (
    <ProvedorSessao>
      <Portao>{children}</Portao>
      <Toaster position="top-center" richColors closeButton />
    </ProvedorSessao>
  );
}
