import { logger, DDBProxy, PatreonHelper, Secrets } from "../lib/_module";

/**
 * Catalog-level adventure helpers. Right now this is just the owned-content
 * lookup the Native Adventure Browser uses to badge which books the user
 * actually owns. The adventure list itself comes from CONFIG.DDB.sources, so
 * the only thing the proxy is needed for here is ownership.
 */
export default class DDBAdventures {

  private static buildBody(extra: Record<string, unknown> = {}, cobalt: string | null = null): Record<string, unknown> {
    return {
      cobalt: cobalt ?? Secrets.getCobalt(),
      betaKey: PatreonHelper.getPatreonKey(),
      ...extra,
    };
  }

  private static async post<T>(path: string, body: Record<string, unknown>): Promise<T | null> {
    const parsingApi = DDBProxy.getProxy();
    const response = await fetch(`${parsingApi}${path}`, {
      method: "POST",
      cache: "no-cache",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data: IDDBProxyResponse<T> = await response.json();
    if (!data.success) {
      logger.error(`DDBAdventures ${path} failed: ${data.message}`, data);
      return null;
    }
    return (data.data ?? null) as T | null;
  }

  // Open GET proxy call (no cobalt/auth). Used for the public meta-data summary.
  private static async get<T>(path: string): Promise<T | null> {
    const parsingApi = DDBProxy.getProxy();
    const response = await fetch(`${parsingApi}${path}`, {
      method: "GET",
      cache: "no-cache",
    });
    const data: IDDBProxyResponse<T> = await response.json();
    if (!data.success) {
      logger.warn(`DDBAdventures ${path} unavailable: ${data.message}`);
      return null;
    }
    return (data.data ?? null) as T | null;
  }

  /**
   * Public meta-data summary for every book with enhanced content (scene counts
   * + per-scene walls/lights/notes/tokens/tiles/stairways).
   */
  static async fetchMetaDataSummary(): Promise<IMetaDataSummary | null> {
    if (CONFIG.DDBI.METADATA_SUMMARY) return CONFIG.DDBI.METADATA_SUMMARY;
    try {
      const data = await DDBAdventures.get<IMetaDataSummary>("/proxy/maps/metadata/summary");
      if (data) CONFIG.DDBI.METADATA_SUMMARY = data;
      return data;
    } catch (error) {
      logger.warn(`DDBAdventures.fetchMetaDataSummary failed: ${error}`);
      return null;
    }
  }

  /**
   * Owned, released book ids for the current cobalt. Returns `null` when the
   * lookup can't be made (no cobalt) or the proxy reports failure - callers
   * fall back to showing every book with no ownership marks. An empty array
   * (`[]`, the user owns nothing) is distinct from `null` (lookup failed).
   *
   * The primary endpoint (`available-user-content`) sometimes gets flagged as a
   * bot and fails (HTML response -> JSON parse error, or `success: false`). When
   * that happens we fall back to `/proxy/library`, whose item `id` matches the
   * source id the primary endpoint returns, so it maps straight to bookIds.
   */
  static async fetchOwnedBookIds({ cobalt = null }: { cobalt?: string | null } = {}): Promise<{ bookIds: number[] | null; enhancementBookIds: number[] | null }> {
    const resolved = cobalt ?? Secrets.getCobalt();
    if (!resolved) return null;

    // Primary lookup. A non-null result is authoritative (empty array = owns
    // nothing). null (success:false) or a thrown error (bot block) -> fall back.
    try {
      const data = await DDBAdventures.post<{ bookIds: number[]; enhancementBookIds: number[] }>(
        "/proxy/adventure/available-user-content",
        DDBAdventures.buildBody({}, resolved),
      );
      if (data) return {
        bookIds: data.bookIds ?? [],
        enhancementBookIds: data.enhancementBookIds ?? [],
      };
    } catch (error) {
      logger.warn(`DDBAdventures.fetchOwnedBookIds primary lookup failed, trying library fallback: ${error}`);
    }

    // Fallback: /proxy/library returns the user's library; ownedOnly narrows it
    // to owned content. The item id == source id used for badging.
    try {
      const data = await DDBAdventures.post<ILibraryItem[]>(
        "/proxy/library",
        DDBAdventures.buildBody({ ownedOnly: false }, resolved),
      );
      if (!data) return null;
      return {
        bookIds: data.filter((item) => item.isOwned).map((item) => item.id),
        enhancementBookIds: data.filter((item) => item.hasEnhancement).map((item) => item.id),
      };
    } catch (error) {
      logger.error(`DDBAdventures.fetchOwnedBookIds library fallback error: ${error}`);
      throw error;
    }
  }

}
