/**
 * Point `game.i18n` at the real `lang/en.json`, so a test can assert the words a user sees
 * rather than the raw keys the global mock returns. Call it in `beforeEach` and the returned
 * function in `afterEach`.
 */
import fs from "node:fs";
import path from "node:path";

interface ILangTree {
  [key: string]: string | ILangTree;
}

let cached: ILangTree | null = null;

function lang(): ILangTree {
  cached ??= JSON.parse(fs.readFileSync(path.resolve(process.cwd(), "lang/en.json"), "utf8")) as ILangTree;
  return cached;
}

/**
 * The English string for a dotted key, or undefined when en.json does not carry it. Entries
 * whose own names contain dots (the `settings.*.name` keys) are not reachable this way.
 */
export function enString(key: string): string | undefined {
  let node: string | ILangTree | undefined = lang();
  for (const part of key.split(".")) {
    if (!node || typeof node === "string") return undefined;
    node = node[part];
  }
  return typeof node === "string" ? node : undefined;
}

export function useEnLocalization(): () => void {
  const i18n = game.i18n as unknown as {
    localize: (key: string) => string;
    format: (key: string, data?: Record<string, unknown>) => string;
  };
  const original = { localize: i18n.localize, format: i18n.format };
  i18n.localize = (key) => enString(key) ?? key;
  i18n.format = (key, data = {}) =>
    (enString(key) ?? key).replace(/\{(\w+)\}/g, (match, name: string) => (name in data ? String(data[name]) : match));
  return () => {
    i18n.localize = original.localize;
    i18n.format = original.format;
  };
}
