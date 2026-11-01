import momento1 from "@/assets/momento-1.asset.json";
import momento2 from "@/assets/momento-2.asset.json";
import momento3 from "@/assets/momento-3.asset.json";
import momento4 from "@/assets/momento-4.asset.json";
import momento5 from "@/assets/momento-5.asset.json";
import momento6 from "@/assets/momento-6.asset.json";
import momento7 from "@/assets/momento-7.asset.json";
import momento8 from "@/assets/momento-8.asset.json";
import momento9 from "@/assets/momento-9.asset.json";

/**
 * As fotos da secao "Momentos" da pagina inicial. A mesma lista forma o
 * album fixo "Momentos" da galeria (/galeria), que fica sempre disponivel
 * mesmo sem nenhum album publicado pelo painel.
 *
 * As descricoes acompanham cada foto para que quem usa leitor de tela ouca o
 * que esta na imagem, e nao apenas "Momento 3".
 */
export const MOMENTO_DESTAQUE = {
  asset: momento1,
  alt: "Palestrante ao microfone diante do painel Mulheres Curadas",
};

export const momentos = [
  {
    asset: momento2,
    alt: "Salão do encontro com mulheres de pé, em oração, com as mãos sobre o peito",
  },
  { asset: momento3, alt: "Participante de braços erguidos em adoração diante do palco" },
  { asset: momento4, alt: "Duas participantes em um longo abraço durante o encontro" },
  { asset: momento5, alt: "Participante de mãos unidas em oração" },
  { asset: momento6, alt: "Participantes de pé, cantando juntas no salão do encontro" },
  { asset: momento7, alt: "Participante de olhos fechados, com a mão sobre o coração" },
  { asset: momento8, alt: "Participante em oração, à mesa, durante o encontro" },
  {
    asset: momento9,
    alt: "Participantes de pé entre as mesas, de olhos fechados e mãos sobre o coração",
  },
];
