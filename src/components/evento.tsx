import { Link } from "@tanstack/react-router";
import { assetUrl } from "@/lib/asset-url";
import { PassosInscricao } from "@/components/passos-inscricao";
import { AvisoDoacao } from "@/components/aviso-doacao";
import { INSCRICOES_ABERTAS, LIMITE_INSCRICOES, proximoEncontro } from "@/config/conteudo";
import { useVagas } from "@/lib/vagas";

/**
 * Bloco do evento: banner, dados do encontro, passo a passo e convite.
 * Aparece na pagina inicial (secao "Evento") e na pagina /eventos, que existe
 * para ter um endereco curto de divulgacao.
 */
export function Evento() {
  const vagas = useVagas();
  const esgotado = vagas.restantes === 0;

  return (
    <div className="grid items-center gap-8 text-foreground lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-14">
      {/* Banner de divulgacao do proximo encontro. Com as inscricoes
        abertas ele tambem leva ao formulario. */}
      {INSCRICOES_ABERTAS && !esgotado ? (
        <Link
          to="/inscricao"
          aria-label="Fazer minha inscrição no encontro de 9 de novembro"
          className="mx-auto block w-full max-w-sm overflow-hidden rounded-2xl ring-1 ring-primary/10"
        >
          <img
            src={assetUrl("/imagens/banner-encontro-9-nov.jpg")}
            alt="Mulheres Curadas por Karoline Rodrigues, com Pr. Samuel Vagner e Gaby Cardozo — 9 de novembro às 18h30"
            width={1280}
            height={1600}
            loading="lazy"
            className="h-auto w-full"
          />
        </Link>
      ) : (
        <img
          src={assetUrl("/imagens/banner-encontro-9-nov.jpg")}
          alt="Mulheres Curadas por Karoline Rodrigues, com Pr. Samuel Vagner e Gaby Cardozo — 9 de novembro às 18h30"
          width={1280}
          height={1600}
          loading="lazy"
          className="mx-auto h-auto w-full max-w-sm rounded-2xl ring-1 ring-primary/10"
        />
      )}

      <div className="text-center lg:text-left">
        <p className="eyebrow text-primary/80">Evento</p>
        <h2 className="sr-only">Evento</h2>
        <div className="mx-auto mt-4 max-w-sm space-y-1 text-left text-[15px] leading-relaxed text-foreground/85 lg:mx-0 lg:max-w-none">
          <p>
            <strong className="font-semibold text-foreground">Data:</strong> 9 de novembro, às 18h30
          </p>
          <p>
            <strong className="font-semibold text-foreground">Local:</strong>{" "}
            {proximoEncontro.local}
          </p>
          <p>
            <strong className="font-semibold text-foreground">Endereço:</strong>{" "}
            {proximoEncontro.endereco}
          </p>
          {INSCRICOES_ABERTAS && (
            <>
              <p>
                <strong className="font-semibold text-foreground">Vagas:</strong>{" "}
                {esgotado
                  ? "Esgotadas"
                  : vagas.restantes === null
                    ? `${vagas.limite ?? LIMITE_INSCRICOES}`
                    : `Restam ${vagas.restantes} de ${vagas.limite ?? LIMITE_INSCRICOES}`}
              </p>
            </>
          )}
        </div>
        <p className="mt-5 text-base leading-relaxed text-foreground/80">
          {!INSCRICOES_ABERTAS
            ? "Em breve inscrições."
            : esgotado
              ? "As vagas deste encontro esgotaram. Obrigada pelo carinho — fique de olho nas próximas datas."
              : "Garanta seu lugar. É simples:"}
        </p>

        {/* A inscricao vive na sua propria pagina (/inscricao), que tem
          endereco curto para mandar no WhatsApp e no Instagram. Aqui
          fica so o convite, para o formulario existir num lugar so. */}
        {INSCRICOES_ABERTAS && !esgotado && (
          <div id="inscricao" className="mt-6 scroll-mt-24">
            <PassosInscricao empilhado />
            <AvisoDoacao className="mt-6" />
            <Link
              to="/inscricao"
              className="mt-6 inline-flex min-h-[44px] items-center justify-center rounded-full bg-primary px-8 py-3 text-xs uppercase tracking-[0.2em] text-primary-foreground transition-all hover:opacity-90"
            >
              Fazer minha inscrição
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
