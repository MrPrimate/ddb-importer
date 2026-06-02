import { logger, DDBProxy, PatreonHelper, Secrets } from "../../../lib/_module";

/**
 * Table name/folder hints from ddb-meta-data's `table_info/<bookCode>.json`.
 * Mirrors the muncher's tableHints. Optional: any failure → empty map.
 *
 * Endpoint: POST {proxy}/proxy/adventure/table-info
 * body { cobalt, betaKey, bookCode } → { success, data: [{ contentChunkId, tableName?, folderName? }] }.
 */

export interface TableHint {
  tableName?: string;
  folderName?: string;
}

export async function fetchTableHints(bookCode: string): Promise<Map<string, TableHint>> {
  const map = new Map<string, TableHint>();
  const cobalt = Secrets.getCobalt();
  if (!cobalt) return map;
  try {
    const response = await fetch(`${DDBProxy.getProxy()}/proxy/adventure/table-info`, {
      method: "POST",
      cache: "no-cache",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cobalt, betaKey: PatreonHelper.getPatreonKey(), bookCode }),
    });
    const json = await response.json();
    if (!json.success) {
      logger.info(`No table hints for ${bookCode}: ${json.message ?? "unknown"}`);
      return map;
    }
    for (const hint of json.data ?? []) {
      if (hint?.contentChunkId) {
        map.set(hint.contentChunkId, { tableName: hint.tableName, folderName: hint.folderName });
      }
    }
    logger.info(`NativeTableHints: ${map.size} table hints for ${bookCode}`);
    return map;
  } catch (error) {
    logger.warn(`NativeTableHints: fetch failed (${(error as Error).message}); continuing without hints`);
    return map;
  }
}
