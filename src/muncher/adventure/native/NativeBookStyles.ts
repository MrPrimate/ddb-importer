import type { NativeBookZip } from "./BookData";

/**
 * The native book download ships a `css/` folder (book.css, shared.css, …). Its
 * `book.css` `:root { … }` block holds the per-book values for the
 * `--theme-*` / `--compendium-*` / `--header-underline` CSS variables that the
 * static module stylesheet `css/journal.css` already consumes via
 * `var(--…, fallback)`.
 *
 * We extract ONLY that variable block (raw native CSS has global selectors -
 * `body`, `#content`, `aside`, `.body-page …` - that would leak into Foundry's
 * whole UI), scope it to `.ddb.<bookcode>` (the class applied to journal content
 * in renderJournalSheet/adventure.ts), rewrite its `url()` asset refs to the
 * uploaded paths, store it on the journal's `flags.ddb.themeCss`, and inject it
 * as a `<style>` lazily when a journal opens.
 *
 * (Foundry rejects `.css` uploads and refuses non-`text/css` stylesheets, so a
 * file + `<link>` is not viable - the CSS travels on the journal flag instead.)
 */

// `../background_texture.png` (relative to css/) → `assets/background_texture.png`
// which is the assetMap key for the uploaded file. Two-or-more `../` (DDB CDN
// `../../manifest/…` images, never uploaded) cannot be resolved → blank url().
//
// The bare stored path is used (as journal image src does): an inline <style>
// resolves url() against the document, so the same relative path that works for
// img src works here too - no getRoute (which would force a root-absolute path).
function rewriteUrls(declarations: string, assetMap: Map<string, string>): string {
  return declarations.replace(/url\(\s*(['"]?)([^'")]*)\1\s*\)/g, (_whole, _q, ref) => {
    if (!ref || !(/^\.\.\/[^/]/).test(ref)) return "url()";
    const key = `assets/${ref.replace(/^\.\.\//, "")}`;
    const stored = assetMap.get(key);
    return stored ? `url("${stored}")` : "url()";
  });
}

/**
 * Build scoped, var-only CSS from the book's native stylesheet.
 * Returns null when there is no zip CSS or no `:root` block to extract.
 */
export async function buildBookThemeCss(
  { zip, bookCode, assetMap }:
  { zip: NativeBookZip; bookCode: string; assetMap: Map<string, string> },
): Promise<string | null> {
  let css = await zip.getText("css/book.css");
  if (!css || !css.includes(":root")) {
    // fall back: first css entry that carries a :root block
    const cssEntry = zip.listEntries().find((n) => n.toLowerCase().endsWith(".css"));
    if (cssEntry && cssEntry !== "css/book.css") css = await zip.getText(cssEntry);
  }
  if (!css) return null;

  const code = bookCode.toLowerCase();
  const blocks: string[] = [];
  const rootRegex = /:root\s*\{([^}]*)\}/g;
  let match: RegExpExecArray | null;
  while ((match = rootRegex.exec(css)) !== null) {
    const decls = rewriteUrls(match[1], assetMap).trim();
    if (decls) blocks.push(decls);
  }
  if (blocks.length === 0) return null;

  return `.ddb.${code} {\n${blocks.join("\n")}\n}\n`;
}

/**
 * Lazily inject a `<style>` with a book's theme CSS, once per book code.
 * No-op without css, or if already present.
 */
export function ensureBookThemeStyle(code: string, css?: string | null): void {
  if (!css) return;
  const id = `ddb-book-theme-${code}`;
  if (document.getElementById(id)) return;
  const style = document.createElement("style");
  style.id = id;
  style.textContent = css;
  document.head.appendChild(style);
}
