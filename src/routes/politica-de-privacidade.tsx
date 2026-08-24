import { createFileRoute, Link } from "@tanstack/react-router";
import { assetUrl } from "@/lib/asset-url";
import logoWordmark from "@/assets/logo-wordmark-v2.asset.json";
import logoMonogram from "@/assets/logo-monogram-v2.asset.json";
import { SITE_URL, contato } from "@/config/conteudo";

/**
 * Politica de Privacidade.
 *
 * O texto descreve exatamente o que o site faz hoje: coleta nome, telefone e
 * e-mail no formulario de inscricao e usa esses dados para contato e
 * organizacao dos encontros. Nada alem disso foi suposto. Se a operacao mudar
 * (novo servico de formulario, lista de transmissao, analytics), atualize aqui.
 */

/** Data da ultima revisao deste texto. Atualize ao editar a politica. */
const ATUALIZADA_EM = "24 de agosto de 2026";

/**
 * Este texto descreve o site como ele esta hoje: o formulario abre o
 * aplicativo de e-mail da visitante, e nada e guardado em servico de
 * terceiro. Ao preencher ENDPOINT_INSCRICAO em src/config/conteudo.ts —
 * ligando a planilha do Google descrita em scripts/inscricoes/ — passe por
 * aqui antes de publicar: as inscricoes passam a ser gravadas e enviadas pelo
 * Google (Planilhas e Gmail), o que muda "Com quem compartilhamos", e o QR
 * code de presenca passa a registrar a data em que voce entrou no encontro.
 */

export const Route = createFileRoute("/politica-de-privacidade")({
  component: PoliticaDePrivacidade,
  head: () => ({
    meta: [
      { title: "Política de Privacidade — Mulheres Curadas" },
      {
        name: "description",
        content:
          "Como o site Mulheres Curadas trata os dados informados no formulário de inscrição, conforme a Lei Geral de Proteção de Dados.",
      },
      { name: "robots", content: "index, follow" },
      { property: "og:title", content: "Política de Privacidade — Mulheres Curadas" },
      { property: "og:url", content: `${SITE_URL}/politica-de-privacidade/` },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/politica-de-privacidade/` }],
  }),
});

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="mt-12">
      <h2 className="text-display text-2xl text-primary md:text-3xl">{titulo}</h2>
      <div className="mt-4 space-y-4 text-base leading-relaxed text-foreground/75">{children}</div>
    </section>
  );
}

function PoliticaDePrivacidade() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-primary/10">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-6 md:px-12">
          <Link
            to="/"
            className="flex items-center gap-3"
            aria-label="Voltar para a página inicial"
          >
            <img
              src={assetUrl(logoMonogram.url)}
              alt=""
              aria-hidden="true"
              width={349}
              height={522}
              className="h-11 w-auto"
            />
            <span className="h-8 w-px bg-primary/15" aria-hidden="true" />
            <img
              src={assetUrl(logoWordmark.url)}
              alt="Mulheres Curadas"
              width={746}
              height={266}
              className="h-8 w-auto"
            />
          </Link>
          <Link
            to="/"
            className="inline-flex min-h-[44px] items-center text-xs uppercase tracking-[0.25em] text-primary underline-offset-8 hover:underline"
          >
            Voltar
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-20 md:px-12 md:py-24">
        <p className="eyebrow text-primary/80">Privacidade</p>
        <h1 className="mt-6 text-display text-4xl leading-tight text-primary md:text-5xl">
          Política de <span className="italic">Privacidade.</span>
        </h1>
        <p className="mt-6 text-sm text-foreground/65">Atualizada em {ATUALIZADA_EM}</p>

        <p className="mt-10 text-lg leading-relaxed text-foreground/80">
          O Mulheres Curadas cuida dos seus dados com o mesmo respeito com que acolhe cada mulher
          nos encontros. Este texto explica, de forma simples, quais informações recolhemos, por que
          recolhemos e o que você pode pedir a qualquer momento, conforme a Lei Geral de Proteção de
          Dados (Lei nº 13.709/2018).
        </p>

        <Secao titulo="Quais dados coletamos">
          <p>
            Somente os que você mesma escreve no formulário de inscrição:{" "}
            <strong>
              nome completo, telefone, e-mail, se você frequenta alguma igreja e, em caso
              afirmativo, o nome dela
            </strong>
            .
          </p>
          <p>
            O site não pede documentos, endereço residencial nem dados de pagamento, e não coleta
            nada automaticamente sobre a sua navegação: não usamos cookies de rastreamento nem
            ferramentas de análise de audiência. As fontes tipográficas são carregadas do serviço
            Google Fonts, que, como todo servidor da internet, registra o endereço IP de quem acessa
            a página.
          </p>
        </Secao>

        <Secao titulo="Para que usamos">
          <p>
            Exclusivamente para entrar em contato com você e organizar os encontros Mulheres
            Curadas: confirmar sua inscrição, enviar informações sobre data, horário e local e
            avisar sobre mudanças.
          </p>
          <p>Seus dados não são vendidos, alugados nem usados para qualquer outra finalidade.</p>
        </Secao>

        <Secao titulo="Com que base legal">
          <p>
            Com o <strong>seu consentimento</strong> (artigo 7º, inciso I, da LGPD), dado quando
            você marca a autorização no formulário antes de enviar a inscrição. Você pode retirar
            esse consentimento quando quiser, sem qualquer custo.
          </p>
        </Secao>

        <Secao titulo="Com quem compartilhamos">
          <p>
            Com ninguém. As inscrições chegam apenas à equipe do Mulheres Curadas, no endereço{" "}
            <a
              href={`mailto:${contato.email}`}
              className="text-primary underline underline-offset-4 hover:opacity-80"
            >
              {contato.email}
            </a>
            .
          </p>
        </Secao>

        <Secao titulo="Por quanto tempo guardamos">
          <p>
            Enquanto durar a finalidade acima — ou seja, enquanto você quiser receber convites para
            os encontros — ou até que você peça a exclusão dos seus dados.
          </p>
        </Secao>

        <Secao titulo="Seus direitos">
          <p>A LGPD garante que você pode, a qualquer momento, pedir:</p>
          <ul className="space-y-2 pl-1">
            {[
              "confirmação de que tratamos os seus dados;",
              "acesso aos dados que você nos informou;",
              "correção de dados incompletos ou desatualizados;",
              "anonimização, bloqueio ou eliminação dos dados;",
              "portabilidade dos dados;",
              "informação sobre com quem compartilhamos seus dados;",
              "revogação do consentimento e exclusão dos dados.",
            ].map((item) => (
              <li key={item} className="flex gap-3">
                <span
                  aria-hidden="true"
                  className="mt-2.5 h-1 w-1 shrink-0 rounded-full bg-primary/40"
                />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <p>
            Para exercer qualquer um deles, basta escrever para{" "}
            <a
              href={`mailto:${contato.email}`}
              className="text-primary underline underline-offset-4 hover:opacity-80"
            >
              {contato.email}
            </a>
            . Respondemos o quanto antes.
          </p>
        </Secao>

        <Secao titulo="Segurança">
          <p>
            Tratamos as inscrições com cuidado e restringimos o acesso à equipe que organiza os
            encontros. Nenhum sistema é infalível, mas nos comprometemos a avisar você caso algum
            incidente relevante aconteça com os seus dados.
          </p>
        </Secao>

        <Secao titulo="Mudanças nesta política">
          <p>
            Se a forma de tratar os dados mudar, este texto é atualizado e a data no topo da página
            muda junto. Recomendamos reler sempre que fizer uma nova inscrição.
          </p>
        </Secao>

        <Secao titulo="Como falar com a gente">
          <p>
            Dúvidas sobre privacidade, pedidos de exclusão ou qualquer assunto relacionado aos seus
            dados:{" "}
            <a
              href={`mailto:${contato.email}`}
              className="text-primary underline underline-offset-4 hover:opacity-80"
            >
              {contato.email}
            </a>
            .
          </p>
        </Secao>

        <div className="mt-16 border-t border-primary/10 pt-10">
          <Link
            to="/"
            className="inline-flex min-h-[44px] items-center rounded-full border border-primary/30 px-6 text-xs uppercase tracking-[0.25em] text-primary transition-all hover:bg-primary hover:text-primary-foreground"
          >
            Voltar para o site
          </Link>
        </div>
      </main>
    </div>
  );
}
