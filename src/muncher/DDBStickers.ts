import { logger, DDBProxy, PatreonHelper, Secrets, utils } from "../lib/_module";

interface IDDBProxyResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}

export default class DDBStickers {

  static getCampaignId(override: string | null = null): string {
    if (override && `${override}`.trim() !== "") return `${override}`;
    // Stickers has its own campaign-id setting separate from the global
    // campaign-id - DDB Stickers content is licensed per-campaign and users
    // commonly want a different scope than character/encounter sync.
    let stickersCampaignId = "";
    try {
      stickersCampaignId = (utils.getSetting<string>("ddb-maps-campaign-id") ?? "").toString().trim();
    } catch (_e) { /* fall through */ }
    if (!stickersCampaignId || `${stickersCampaignId}`.trim() === "") {
      logger.error("DDBStickers: no campaignId set");
      return "";
    }
    return `${stickersCampaignId}`;
  }

  private static buildBody(extra: Record<string, unknown> = {}, cobalt: string | null = null): Record<string, unknown> {
    return {
      cobalt: cobalt ?? Secrets.getCobalt(),
      betaKey: PatreonHelper.getPatreonKey(),
      ...extra,
    };
  }

  private static async post<T>(path: string, body: Record<string, unknown>): Promise<T | null> {
    const parsingApi = DDBProxy.getProxy();
    try {
      const response = await fetch(`${parsingApi}${path}`, {
        method: "POST",
        cache: "no-cache",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data: IDDBProxyResponse<T> = await response.json();
      if (!data.success) {
        logger.error(`DDBStickers ${path} failed: ${data.message}`, data);
        return null;
      }
      return (data.data ?? null) as T | null;
    } catch (error) {
      logger.error(`DDBStickers ${path} error: ${error}`);
      throw error;
    }
  }

  static async fetchAll({
    cobalt = null,
    campaignId = null,
  }: { cobalt?: string | null; campaignId?: string | null } = {}): Promise<IDDBStickersPayload | null> {
    const resolvedCampaignId = DDBStickers.getCampaignId(campaignId);
    if (!resolvedCampaignId) return null;
    const body = DDBStickers.buildBody({ campaignId: resolvedCampaignId }, cobalt);
    return DDBStickers.post<IDDBStickersPayload>("/proxy/stickers", body);
  }

  static async downloadImage({
    key,
    cobalt = null,
    campaignId = null,
  }: { key: string; cobalt?: string | null; campaignId?: string | null }): Promise<Blob | null> {
    const resolvedCampaignId = DDBStickers.getCampaignId(campaignId);
    if (!resolvedCampaignId) return null;
    if (!key) {
      logger.error("DDBStickers.downloadImage: no key supplied");
      return null;
    }
    const parsingApi = DDBProxy.getProxy();
    const body = DDBStickers.buildBody({ campaignId: resolvedCampaignId, key }, cobalt);
    try {
      const response = await fetch(`${parsingApi}/proxy/stickers/download`, {
        method: "POST",
        cache: "no-cache",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const contentType = response.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        let message = `HTTP ${response.status}`;
        try {
          const json = await response.json();
          if (json?.message) message = json.message;
        } catch (_e) { /* keep status-only message */ }
        logger.error(`DDBStickers.downloadImage failed: ${message}`);
        return null;
      }
      if (!response.ok) {
        logger.error(`DDBStickers.downloadImage failed: HTTP ${response.status}`);
        return null;
      }
      return await response.blob();
    } catch (error) {
      logger.error(`DDBStickers.downloadImage error: ${error}`);
      throw error;
    }
  }

  // Group stickers by primarySourceId for browser display.
  static groupBySource(payload: IDDBStickersPayload | null): Map<number, IDDBSticker[]> {
    const groups = new Map<number, IDDBSticker[]>();
    if (!payload) return groups;
    for (const s of payload.stickers) {
      const id = typeof s.primarySourceId === "number" ? s.primarySourceId : -1;
      if (!groups.has(id)) groups.set(id, []);
      groups.get(id)!.push(s);
    }
    return groups;
  }

  static slugForSource(sourceId: number, sourceName?: string | null): string {
    const safe = (sourceName || `source-${sourceId}`).toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    return safe || `source-${sourceId}`;
  }

  static filenameFromImageKey(imageKey: string): string {
    const last = (imageKey || "").split("/").pop() || "sticker";
    return last.replace(/[^A-Za-z0-9._-]+/g, "-");
  }

}
