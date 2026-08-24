/**
 * Gera copias otimizadas das fotos em public/imagens.
 *
 * Os arquivos originais NAO sao tocados: eles continuam servindo de fallback
 * para navegadores antigos. O que sai daqui vai para public/imagens/otim/ em
 * AVIF e WebP, em varias larguras, mais o manifesto src/lib/imagens-manifesto.json
 * que o componente <ImagemResponsiva> le para montar o srcset.
 *
 * Como rodar (o sharp e ferramenta de bancada, nao dependencia do site):
 *
 *   bun add -d sharp && bun scripts/otimizar-imagens.mjs
 *
 * Depois de rodar, comite public/imagens/otim/ e o manifesto. Rode de novo
 * sempre que uma foto nova entrar em public/imagens.
 */
import sharp from "sharp";
import { readdir, mkdir, writeFile, stat } from "node:fs/promises";
import { join, resolve, parse } from "node:path";

const raiz = resolve(import.meta.dirname, "..");
const origem = join(raiz, "public", "imagens");
const destino = join(origem, "otim");
const manifesto = join(raiz, "src", "lib", "imagens-manifesto.json");

// Escada de larguras. Cada foto so gera as que couberem no original —
// ampliar uma foto pequena so gastaria bytes sem ganhar nitidez.
const LARGURAS = [360, 480, 768, 1024, 1440];

// Fotos que entram no <picture>. O logo e o monograma ficam de fora: sao PNG
// pequenos com transparencia e ja carregam rapido.
const EXTENSOES = new Set([".jpg", ".jpeg"]);

await mkdir(destino, { recursive: true });

const arquivos = (await readdir(origem)).filter((f) => EXTENSOES.has(parse(f).ext.toLowerCase()));
const saida = {};

for (const arquivo of arquivos.sort()) {
  const { name } = parse(arquivo);
  const entrada = join(origem, arquivo);
  const meta = await sharp(entrada).metadata();
  const larguras = LARGURAS.filter((l) => l < meta.width).concat(meta.width);

  const variantes = { avif: [], webp: [] };

  for (const largura of larguras) {
    const altura = Math.round((meta.height / meta.width) * largura);

    for (const formato of ["avif", "webp"]) {
      const nome = `${name}-${largura}.${formato}`;
      const caminho = join(destino, nome);
      const pipeline = sharp(entrada).resize({ width: largura, withoutEnlargement: true });

      if (formato === "avif") await pipeline.avif({ quality: 55, effort: 4 }).toFile(caminho);
      else await pipeline.webp({ quality: 78 }).toFile(caminho);

      const { size } = await stat(caminho);
      variantes[formato].push({ url: `/imagens/otim/${nome}`, largura, bytes: size });
    }

    void altura;
  }

  saida[`/imagens/${arquivo}`] = {
    largura: meta.width,
    altura: meta.height,
    original: `/imagens/${arquivo}`,
    ...variantes,
  };

  console.log(`${arquivo} ${meta.width}x${meta.height} -> ${larguras.join(", ")}`);
}

await writeFile(manifesto, `${JSON.stringify(saida, null, 2)}\n`);
console.log(`\nManifesto: ${manifesto}`);
