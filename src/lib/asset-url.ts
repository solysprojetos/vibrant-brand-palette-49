/**
 * Resolve a public asset path against the deploy base.
 *
 * GitHub Pages serves the site from /<repo>/, so a hard-coded "/imagens/x.jpg"
 * would 404 there. Vite rewrites the paths it controls (JS, CSS) using `base`,
 * but not plain strings like the `url` field in our *.asset.json files —
 * those go through here instead.
 */
export function assetUrl(path: string): string {
  return `${import.meta.env.BASE_URL}${path.replace(/^\//, "")}`;
}
