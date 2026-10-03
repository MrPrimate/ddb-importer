import logger from "./Logger";
import { fetchJson } from "./FetchHelper";
import FileHelper from "./FileHelper";

/**
 * Serves character payloads from saved JSON instead of the DDB proxy, so lifecycle
 * recaptures and re-import checks replay the exact payload a fixture was built from rather
 * than fetching every character again. Accepts a `debug-import-capture` document (format 2+,
 * whose `source` is the pre-parse snapshot) or a raw proxy response (`<id>-<name>-raw.json`).
 */
export default class DDBCharacterLocalSource {

  /** folder path -> file paths, so a bulk run lists the folder once */
  static #listings = new Map<string, string[]>();

  static clearCache() {
    DDBCharacterLocalSource.#listings.clear();
  }

  /**
   * Reduces a capture or raw proxy response to the response the parser consumes.
   * Throws when the document cannot be replayed.
   */
  static normalize(json: unknown, label = "local character source"): IDDBCharacterResponse {
    if (!json || typeof json !== "object" || Array.isArray(json)) {
      throw new Error(`${label} is not a JSON object`);
    }
    const data = json as Record<string, any>;
    if ("format" in data && "source" in data) {
      // format 1 captures took `source` after process() had mutated it, so it cannot be parsed again
      if (typeof data.format !== "number" || data.format < 2) {
        throw new Error(`${label} is a format ${data.format} capture whose source was taken after parsing`);
      }
      return DDBCharacterLocalSource.normalize(data.source, label);
    }
    if (data.success !== true || !data.ddb?.character) {
      throw new Error(`${label} does not hold a successful DDB character response`);
    }
    return data as IDDBCharacterResponse;
  }

  static #fileName(path: string): string {
    const name = path.split("/").pop() ?? "";
    try {
      return decodeURIComponent(name);
    } catch (_error) {
      return name;
    }
  }

  /**
   * Picks the file for a character from a folder listing: `<id>-<name>-import.json` first,
   * then `<id>-<name>-raw.json`. Browser re-downloads (`... (1).json`) are skipped.
   */
  static pickFile(files: string[], characterId: string | number): string | null {
    const prefix = `${characterId}-`;
    const rank = (name: string) => (name.endsWith("-import.json") ? 0 : 1);
    const candidates = files
      .map((path) => ({ path, name: DDBCharacterLocalSource.#fileName(path) }))
      .filter(({ name }) => name.startsWith(prefix)
        && (name.endsWith("-import.json") || name.endsWith("-raw.json"))
        && !(/ \(\d+\)\.json$/).test(name))
      .sort((a, b) => rank(a.name) - rank(b.name) || a.name.localeCompare(b.name));
    return candidates[0]?.path ?? null;
  }

  /** Lists a folder (`[data] some/path` or a plain data-relative path) without creating it. */
  static async listFiles(folder: string): Promise<string[]> {
    const cached = DDBCharacterLocalSource.#listings.get(folder);
    if (cached) return cached;
    const dir = FileHelper.parseDirectory(folder);
    const result = await foundry.applications.apps.FilePicker.implementation.browse(dir.activeSource, dir.current, {
      bucket: dir.bucket ?? undefined,
    });
    const files = result.files ?? [];
    DDBCharacterLocalSource.#listings.set(folder, files);
    return files;
  }

  /**
   * Loads the saved payload for a character from a folder of captures.
   * Returns null when the folder holds no file for the character.
   */
  static async load(characterId: string | number, folder: string): Promise<IDDBCharacterLocalSourceResult | null> {
    const files = await DDBCharacterLocalSource.listFiles(folder);
    const file = DDBCharacterLocalSource.pickFile(files, characterId);
    if (!file) {
      logger.warn(`No local source for character ${characterId} in ${folder}`);
      return null;
    }
    const json = await fetchJson<unknown>(file, { cache: "no-cache" });
    const response = DDBCharacterLocalSource.normalize(json, DDBCharacterLocalSource.#fileName(file));
    const sourceId = response.ddb.character.id;
    if (sourceId !== undefined && String(sourceId) !== String(characterId)) {
      throw new Error(`Local source ${file} holds character ${sourceId}, not ${characterId}`);
    }
    return { response, file: DDBCharacterLocalSource.#fileName(file) };
  }

}
