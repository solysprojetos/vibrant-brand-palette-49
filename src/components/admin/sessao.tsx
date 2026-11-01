import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import type { Acesso } from "@/lib/cms/tipos";

type EstadoSessao = {
  carregando: boolean;
  sessao: Session | null;
  acesso: Acesso | null;
  /** Veio pelo link "esqueci minha senha": pede a nova senha antes de tudo. */
  redefinindoSenha: boolean;
  concluirRedefinicao: () => void;
  recarregarAcesso: () => Promise<void>;
  sair: () => Promise<void>;
};

const Contexto = createContext<EstadoSessao | null>(null);

export function useSessao(): EstadoSessao {
  const valor = useContext(Contexto);
  if (!valor) throw new Error("useSessao fora do ProvedorSessao");
  return valor;
}

/**
 * Sessao do painel. O login e do Supabase Auth; o acesso ao painel e dado
 * pela tabela mc_equipe_acesso (quem nao esta la ve so o aviso de "sem
 * acesso", mesmo com login valido). As politicas RLS do banco repetem essa
 * regra, entao esconder a tela aqui e conforto — a protecao de verdade e o banco.
 */
export function ProvedorSessao({ children }: { children: ReactNode }) {
  const [carregando, setCarregando] = useState(true);
  const [sessao, setSessao] = useState<Session | null>(null);
  const [acesso, setAcesso] = useState<Acesso | null>(null);
  const [redefinindoSenha, setRedefinindoSenha] = useState(false);

  const buscarAcesso = useCallback(async (s: Session | null) => {
    if (!s) {
      setAcesso(null);
      return;
    }
    const { data } = await supabase()
      .from("mc_equipe_acesso")
      .select("user_id, nome, email, papel")
      .eq("user_id", s.user.id)
      .maybeSingle();
    setAcesso((data as Acesso | null) ?? null);
  }, []);

  useEffect(() => {
    let ativo = true;
    const cliente = supabase();

    cliente.auth.getSession().then(async ({ data }) => {
      if (!ativo) return;
      setSessao(data.session);
      await buscarAcesso(data.session);
      if (ativo) setCarregando(false);
    });

    const { data: inscricao } = cliente.auth.onAuthStateChange((evento, novaSessao) => {
      if (!ativo) return;
      if (evento === "PASSWORD_RECOVERY") setRedefinindoSenha(true);
      setSessao(novaSessao);
      // Fora do callback: chamar o banco dentro dele trava o cliente do Supabase.
      setTimeout(() => {
        void buscarAcesso(novaSessao).finally(() => ativo && setCarregando(false));
      }, 0);
    });

    return () => {
      ativo = false;
      inscricao.subscription.unsubscribe();
    };
  }, [buscarAcesso]);

  const sair = useCallback(async () => {
    await supabase().auth.signOut();
    setSessao(null);
    setAcesso(null);
  }, []);

  return (
    <Contexto.Provider
      value={{
        carregando,
        sessao,
        acesso,
        redefinindoSenha,
        concluirRedefinicao: () => setRedefinindoSenha(false),
        recarregarAcesso: () => buscarAcesso(sessao),
        sair,
      }}
    >
      {children}
    </Contexto.Provider>
  );
}
