import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/lib/supabase";
import { CONTEUDO_PADRAO, mesclarConteudo, type ConteudoSite } from "@/lib/cms/conteudo";
import { traduzirErro } from "@/lib/cms/util";
import {
  BOTAO_PRIMARIO,
  CAMPO,
  CARTAO,
  CabecalhoPagina,
  Campo,
  CampoImagem,
  Carregando,
  ErroCarregar,
  Interruptor,
} from "../ui";

type Chave = keyof ConteudoSite;

export function PaginaConteudo() {
  const cliente = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "conteudo"],
    queryFn: async () => {
      const { data, error } = await supabase().from("mc_conteudo").select("chave, valor");
      if (error) throw error;
      return mesclarConteudo((data ?? []) as { chave: string; valor: Record<string, unknown> }[]);
    },
  });
  const [form, setForm] = useState<ConteudoSite>(CONTEUDO_PADRAO);
  const [salvando, setSalvando] = useState<Chave | null>(null);

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  if (error) return <ErroCarregar erro={error} />;
  if (isLoading) return <Carregando />;

  const salvar = async (chave: Chave) => {
    const valor = form[chave] as Record<string, unknown>;
    for (const campo of ["instagram", "mapa_url"]) {
      const v = String(valor[campo] ?? "").trim();
      if (v && !/^https?:\/\//i.test(v)) return toast.error("Links precisam começar com https://");
    }
    setSalvando(chave);
    const { error } = await supabase().from("mc_conteudo").upsert({ chave, valor });
    setSalvando(null);
    if (error) return void toast.error(traduzirErro(error));
    toast.success("Textos salvos. O site já mostra a versão nova.");
    void cliente.invalidateQueries({ queryKey: ["admin", "conteudo"] });
    void cliente.invalidateQueries({ queryKey: ["publico"] });
  };

  const sobre = <K extends keyof ConteudoSite["sobre"]>(
    campo: K,
    valor: ConteudoSite["sobre"][K],
  ) => setForm((f) => ({ ...f, sobre: { ...f.sobre, [campo]: valor } }));
  const contato = <K extends keyof ConteudoSite["contato"]>(
    campo: K,
    valor: ConteudoSite["contato"][K],
  ) => setForm((f) => ({ ...f, contato: { ...f.contato, [campo]: valor } }));
  const inicio = <K extends keyof ConteudoSite["inicio"]>(
    campo: K,
    valor: ConteudoSite["inicio"][K],
  ) => setForm((f) => ({ ...f, inicio: { ...f.inicio, [campo]: valor } }));

  const Salvar = ({ chave }: { chave: Chave }) => (
    <div className="flex justify-end pt-2">
      <button
        type="button"
        onClick={() => void salvar(chave)}
        disabled={salvando !== null}
        className={BOTAO_PRIMARIO}
      >
        {salvando === chave && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
        Salvar
      </button>
    </div>
  );

  return (
    <>
      <CabecalhoPagina
        titulo="Conteúdo do site"
        descricao="Edite os textos institucionais, a idealizadora, contatos e redes sociais — sem precisar de programador. Fica guardado no painel. O site atual ainda não mostra esta seção — ela entra no ar quando vocês decidirem publicar."
      />
      <Tabs defaultValue="sobre">
        <TabsList className="mb-6 h-auto flex-wrap gap-1 rounded-full bg-white p-1 ring-1 ring-[color:var(--admin-linha)]">
          <TabsTrigger
            value="sobre"
            className="rounded-full px-5 py-2 data-[state=active]:bg-[color:var(--admin-vinho)] data-[state=active]:text-white"
          >
            História e missão
          </TabsTrigger>
          <TabsTrigger
            value="idealizadora"
            className="rounded-full px-5 py-2 data-[state=active]:bg-[color:var(--admin-vinho)] data-[state=active]:text-white"
          >
            Idealizadora
          </TabsTrigger>
          <TabsTrigger
            value="contato"
            className="rounded-full px-5 py-2 data-[state=active]:bg-[color:var(--admin-vinho)] data-[state=active]:text-white"
          >
            Contato e redes
          </TabsTrigger>
          <TabsTrigger
            value="inicio"
            className="rounded-full px-5 py-2 data-[state=active]:bg-[color:var(--admin-vinho)] data-[state=active]:text-white"
          >
            Página inicial
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sobre">
          <section className={`${CARTAO} grid gap-5 p-6 md:p-8 lg:grid-cols-2`}>
            <Campo rotulo="Título da página Sobre" className="lg:col-span-2">
              {(i) => (
                <input
                  id={i}
                  className={CAMPO}
                  value={form.sobre.titulo}
                  onChange={(e) => sobre("titulo", e.target.value)}
                />
              )}
            </Campo>
            <Campo rotulo="Apresentação" className="lg:col-span-2">
              {(i) => (
                <textarea
                  id={i}
                  rows={3}
                  className={CAMPO}
                  value={form.sobre.introducao}
                  onChange={(e) => sobre("introducao", e.target.value)}
                />
              )}
            </Campo>
            <Campo
              rotulo="Nossa história"
              dica="Separe os parágrafos com uma linha em branco."
              className="lg:col-span-2"
            >
              {(i) => (
                <textarea
                  id={i}
                  rows={8}
                  className={CAMPO}
                  value={form.sobre.historia}
                  onChange={(e) => sobre("historia", e.target.value)}
                />
              )}
            </Campo>
            <Campo rotulo="Nossa missão">
              {(i) => (
                <textarea
                  id={i}
                  rows={4}
                  className={CAMPO}
                  value={form.sobre.missao}
                  onChange={(e) => sobre("missao", e.target.value)}
                />
              )}
            </Campo>
            <Campo rotulo="Nossa visão">
              {(i) => (
                <textarea
                  id={i}
                  rows={4}
                  className={CAMPO}
                  value={form.sobre.visao}
                  onChange={(e) => sobre("visao", e.target.value)}
                />
              )}
            </Campo>
            <Campo rotulo="Nossos valores" dica="Um valor por linha.">
              {(i) => (
                <textarea
                  id={i}
                  rows={4}
                  className={CAMPO}
                  value={form.sobre.valores}
                  onChange={(e) => sobre("valores", e.target.value)}
                />
              )}
            </Campo>
            <Campo rotulo="Nosso propósito">
              {(i) => (
                <textarea
                  id={i}
                  rows={4}
                  className={CAMPO}
                  value={form.sobre.proposito}
                  onChange={(e) => sobre("proposito", e.target.value)}
                />
              )}
            </Campo>
            <div className="max-w-xs">
              <CampoImagem
                rotulo="Foto da história (opcional)"
                valor={form.sobre.imagem || null}
                aoMudar={(url) => sobre("imagem", url ?? "")}
                pasta="site"
                proporcao="aspect-[4/5]"
                dica="Aparece ao lado da história. Sem foto, o site usa a imagem atual."
              />
            </div>
            <div className="lg:col-span-2">
              <Salvar chave="sobre" />
            </div>
          </section>
        </TabsContent>

        <TabsContent value="idealizadora">
          <section className={`${CARTAO} grid gap-6 p-6 md:p-8 lg:grid-cols-[280px_minmax(0,1fr)]`}>
            <CampoImagem
              rotulo="Foto"
              valor={form.sobre.idealizadora_foto || null}
              aoMudar={(url) => sobre("idealizadora_foto", url ?? "")}
              pasta="site"
              proporcao="aspect-[3/4]"
            />
            <div className="space-y-5">
              <Campo rotulo="Nome">
                {(i) => (
                  <input
                    id={i}
                    className={CAMPO}
                    value={form.sobre.idealizadora_nome}
                    onChange={(e) => sobre("idealizadora_nome", e.target.value)}
                  />
                )}
              </Campo>
              <Campo rotulo="Título">
                {(i) => (
                  <input
                    id={i}
                    className={CAMPO}
                    value={form.sobre.idealizadora_titulo}
                    onChange={(e) => sobre("idealizadora_titulo", e.target.value)}
                  />
                )}
              </Campo>
              <Campo rotulo="Quem é ela" dica="Aparece na página Sobre.">
                {(i) => (
                  <textarea
                    id={i}
                    rows={6}
                    className={CAMPO}
                    value={form.sobre.idealizadora_texto}
                    onChange={(e) => sobre("idealizadora_texto", e.target.value)}
                  />
                )}
              </Campo>
              <Salvar chave="sobre" />
            </div>
          </section>
        </TabsContent>

        <TabsContent value="contato">
          <section className={`${CARTAO} grid gap-5 p-6 md:p-8 lg:grid-cols-2`}>
            <Campo rotulo="E-mail">
              {(i) => (
                <input
                  id={i}
                  type="email"
                  className={CAMPO}
                  value={form.contato.email}
                  onChange={(e) => contato("email", e.target.value)}
                />
              )}
            </Campo>
            <Campo rotulo="Instagram oficial" dica="Endereço completo do perfil.">
              {(i) => (
                <input
                  id={i}
                  type="url"
                  className={CAMPO}
                  value={form.contato.instagram}
                  onChange={(e) => contato("instagram", e.target.value)}
                  placeholder="https://www.instagram.com/mulherescuradas"
                />
              )}
            </Campo>
            <Campo rotulo="WhatsApp" dica="Número com DDD ou link wa.me.">
              {(i) => (
                <input
                  id={i}
                  className={CAMPO}
                  value={form.contato.whatsapp}
                  onChange={(e) => contato("whatsapp", e.target.value)}
                  placeholder="(85) 90000-0000"
                />
              )}
            </Campo>
            <Campo rotulo="WhatsApp como aparece escrito">
              {(i) => (
                <input
                  id={i}
                  className={CAMPO}
                  value={form.contato.whatsapp_texto}
                  onChange={(e) => contato("whatsapp_texto", e.target.value)}
                  placeholder="(85) 90000-0000"
                />
              )}
            </Campo>
            <Campo rotulo="Endereço" className="lg:col-span-2">
              {(i) => (
                <input
                  id={i}
                  className={CAMPO}
                  value={form.contato.endereco}
                  onChange={(e) => contato("endereco", e.target.value)}
                />
              )}
            </Campo>
            <Campo rotulo="Link do mapa (opcional)" className="lg:col-span-2">
              {(i) => (
                <input
                  id={i}
                  type="url"
                  className={CAMPO}
                  value={form.contato.mapa_url}
                  onChange={(e) => contato("mapa_url", e.target.value)}
                />
              )}
            </Campo>
            <div className="lg:col-span-2">
              <Salvar chave="contato" />
            </div>
          </section>
        </TabsContent>

        <TabsContent value="inicio">
          <section className={`${CARTAO} space-y-5 p-6 md:p-8`}>
            <Campo
              rotulo="Mensagem da idealizadora"
              dica="Mensagem assinada pela idealizadora, para usar quando a página Sobre for publicada."
            >
              {(i) => (
                <textarea
                  id={i}
                  rows={5}
                  className={CAMPO}
                  value={form.inicio.mensagem_idealizadora}
                  onChange={(e) => inicio("mensagem_idealizadora", e.target.value)}
                />
              )}
            </Campo>
            <Interruptor
              rotulo="Usar os testemunhos em destaque do painel"
              descricao="Preferência guardada para quando os depoimentos da página inicial passarem a vir do painel. Hoje a página inicial não muda."
              marcado={form.inicio.mostrar_ultimas_mensagens}
              aoMudar={(v) => inicio("mostrar_ultimas_mensagens", v)}
            />
            <Salvar chave="inicio" />
          </section>
        </TabsContent>
      </Tabs>
    </>
  );
}
