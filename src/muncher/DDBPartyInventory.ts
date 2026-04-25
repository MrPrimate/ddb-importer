import { logger, DDBProxy, PatreonHelper, Secrets, DDBCampaigns } from "../lib/_module";

export interface IDDBPartyItemDefinition {
  id: number;
  baseTypeId?: number;
  entityTypeId?: number;
  definitionKey?: string;
  name: string;
  description?: string | null;
  snippet?: string | null;
  weight?: number;
  cost?: number | null;
  type?: string | null;
  rarity?: string | null;
  magic?: boolean;
  isHomebrew?: boolean;
  isCustomItem?: boolean;
  isContainer?: boolean;
  isLegacy?: boolean;
  stackable?: boolean;
  bundleSize?: number;
  avatarUrl?: string | null;
  largeAvatarUrl?: string | null;
  filterType?: string | null;
  tags?: string[];
  grantedModifiers?: any[];
  sources?: any[];
  baseItemId?: number | null;
  baseArmorName?: string | null;
  armorClass?: number | null;
  armorTypeId?: number | null;
  damage?: any;
  damageType?: string | null;
  properties?: any;
  attackType?: number | null;
  range?: number | null;
  longRange?: number | null;
  capacity?: string | null;
  capacityWeight?: number;
  weightMultiplier?: number;
  canBeAddedToInventory?: boolean;
  canEquip?: boolean;
  canAttune?: boolean;
}

export interface IDDBPartyInventoryItem {
  id: number;
  entityTypeId?: number;
  definition: IDDBPartyItemDefinition;
  definitionId?: number;
  definitionTypeId?: number;
  displayAsAttack?: boolean | null;
  quantity: number;
  isAttuned?: boolean;
  equipped?: boolean;
  equippedEntityTypeId?: number | null;
  equippedEntityId?: number | null;
  chargesUsed?: number;
  limitedUse?: { maxUses?: number; numberUsed?: number; resetType?: string; resetTypeDescription?: string } | null;
  containerEntityId?: number | null;
  containerEntityTypeId?: number | null;
  containerDefinitionKey?: string | null;
  currency?: { cp?: number; sp?: number; ep?: number; gp?: number; pp?: number } | null;
  originEntityTypeId?: number | null;
  originEntityId?: number | null;
  originDefinitionKey?: string | null;
}

export interface IDDBPartyCurrency {
  cp?: number;
  sp?: number;
  ep?: number;
  gp?: number;
  pp?: number;
}

export interface IDDBPartyInventory {
  modifiers?: { item?: any[] };
  spells?: { item?: any[] };
  partyItems: IDDBPartyInventoryItem[];
  sharingState?: number;
  partyValues?: any[];
  currency?: IDDBPartyCurrency;
  partyInfusions?: any[];
  partyRestrictions?: any[];
}

export interface IDDBCampaignCharacter {
  characterId: number;
  userId?: number;
  username?: string;
  characterName: string;
  characterUrl?: string;
  avatarUrl?: string | null;
  privacyType?: number;
  campaignId?: number;
  isAssignedToPlayer?: boolean;
}

export interface IDDBCampaignInfo {
  campaignId: number;
  name: string | null;
  dmUsername: string | null;
  dmId: number | null;
  dateCreated: string | null;
  playerCount: number;
  characters: IDDBCampaignCharacter[];
}

export default class DDBPartyInventory {

  static getCampaignId(notifier: any = null, override: string | null = null): string {
    const campaignId = override ?? DDBCampaigns.getCampaignId(notifier);
    if (!campaignId || `${campaignId}`.trim() === "") {
      logger.error("No campaignId set; party inventory requires a campaign.");
      return "";
    }
    return `${campaignId}`;
  }

  static async fetchCampaignInfo({
    cobalt = null,
    campaignId = null,
  }: { cobalt?: string | null; campaignId?: string | null } = {}): Promise<IDDBCampaignInfo | null> {
    const cobaltCookie = cobalt ?? Secrets.getCobalt();
    const parsingApi = DDBProxy.getProxy();
    const betaKey = PatreonHelper.getPatreonKey();
    const resolvedCampaignId = DDBPartyInventory.getCampaignId(null, campaignId);
    if (!resolvedCampaignId) return null;

    const body = {
      cobalt: cobaltCookie,
      betaKey,
      campaignId: resolvedCampaignId,
    };

    try {
      const response = await fetch(`${parsingApi}/proxy/party/${resolvedCampaignId}/characters`, {
        method: "POST",
        cache: "no-cache",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!data.success) {
        logger.error(`Campaign characters fetch failed: ${data.message}`, data);
        return null;
      }

      // Backwards-compat: older proxies returned a bare characters array
      const payload = Array.isArray(data.data)
        ? { campaignId: parseInt(resolvedCampaignId), name: null, dmUsername: null, dmId: null, dateCreated: null, playerCount: data.data.length, characters: data.data }
        : data.data;

      if (payload?.rawCharacterSample || payload?.rawCampaignKeys) {
        logger.warn("DDBPartyInventory: proxy returned diagnostic payload (no characters extracted)", {
          rawCampaignKeys: payload?.rawCampaignKeys,
          rawCharacterSample: payload?.rawCharacterSample,
        });
      }

      const target = parseInt(resolvedCampaignId);
      const characters: IDDBCampaignCharacter[] = (payload?.characters ?? []).filter((c: IDDBCampaignCharacter) => {
        if (c?.campaignId === undefined || c?.campaignId === null) return true;
        return parseInt(`${c.campaignId}`) === target;
      });

      return {
        campaignId: target,
        name: payload?.name ?? null,
        dmUsername: payload?.dmUsername ?? null,
        dmId: payload?.dmId ?? null,
        dateCreated: payload?.dateCreated ?? null,
        playerCount: payload?.playerCount ?? characters.length,
        characters,
      };
    } catch (error) {
      logger.error(`Campaign info fetch error: ${error}`);
      throw error;
    }
  }

  static async fetchCampaignCharacters({
    cobalt = null,
    campaignId = null,
  }: { cobalt?: string | null; campaignId?: string | null } = {}): Promise<IDDBCampaignCharacter[]> {
    const info = await DDBPartyInventory.fetchCampaignInfo({ cobalt, campaignId });
    return info?.characters ?? [];
  }

  static async fetchPartyInventory({
    cobalt = null,
    campaignId = null,
  }: { cobalt?: string | null; campaignId?: string | null } = {}): Promise<IDDBPartyInventory | null> {
    const cobaltCookie = cobalt ?? Secrets.getCobalt();
    const parsingApi = DDBProxy.getProxy();
    const betaKey = PatreonHelper.getPatreonKey();
    const resolvedCampaignId = DDBPartyInventory.getCampaignId(null, campaignId);
    if (!resolvedCampaignId) return null;

    const body = {
      cobalt: cobaltCookie,
      betaKey,
      campaignId: resolvedCampaignId,
    };

    try {
      const response = await fetch(`${parsingApi}/proxy/party/${resolvedCampaignId}/inventory`, {
        method: "POST",
        cache: "no-cache",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!data.success) {
        logger.error(`Party inventory fetch failed: ${data.message}`, data);
        return null;
      }
      return data.data as IDDBPartyInventory;
    } catch (error) {
      logger.error(`Party inventory fetch error: ${error}`);
      throw error;
    }
  }

  static readonly PARTY_CONTAINER_ENTITY_TYPE_ID = 618115330;

  static async moveInventoryItem({
    cobalt = null,
    characterId,
    id,
    containerEntityId,
    containerEntityTypeId = DDBPartyInventory.PARTY_CONTAINER_ENTITY_TYPE_ID,
  }: {
    cobalt?: string | null;
    characterId: number | string;
    id: number | string;
    containerEntityId: number | string;
    containerEntityTypeId?: number;
  }) {
    const cobaltCookie = cobalt ?? Secrets.getCobalt();
    const parsingApi = DDBProxy.getProxy();
    const betaKey = PatreonHelper.getPatreonKey();

    const body = {
      cobalt: cobaltCookie,
      betaKey,
      characterId,
      id,
      containerEntityId,
      containerEntityTypeId,
    };

    try {
      const response = await fetch(`${parsingApi}/proxy/inventory/item/move`, {
        method: "PUT",
        cache: "no-cache",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!data.success) {
        logger.error(`Inventory item move failed: ${data.message}`, data);
        return null;
      }
      return data.data;
    } catch (error) {
      logger.error(`Inventory item move error: ${error}`);
      throw error;
    }
  }

  static async moveItemToParty({
    cobalt = null,
    characterId,
    id,
    campaignId,
  }: {
    cobalt?: string | null;
    characterId: number | string;
    id: number | string;
    campaignId: number | string;
  }) {
    return DDBPartyInventory.moveInventoryItem({
      cobalt,
      characterId,
      id,
      containerEntityId: campaignId,
      containerEntityTypeId: DDBPartyInventory.PARTY_CONTAINER_ENTITY_TYPE_ID,
    });
  }

  static async deleteInventoryItem({
    cobalt = null,
    characterId,
    id,
    removeContainerContents = false,
    campaignId = null,
  }: {
    cobalt?: string | null;
    characterId: number | string;
    id: number | string;
    removeContainerContents?: boolean;
    campaignId?: number | string | null;
  }) {
    const cobaltCookie = cobalt ?? Secrets.getCobalt();
    const parsingApi = DDBProxy.getProxy();
    const betaKey = PatreonHelper.getPatreonKey();

    const body = {
      cobalt: cobaltCookie,
      betaKey,
      characterId,
      id,
      removeContainerContents,
      campaignId,
    };

    try {
      const response = await fetch(`${parsingApi}/proxy/inventory/item`, {
        method: "DELETE",
        cache: "no-cache",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!data.success) {
        logger.error(`Inventory item delete failed: ${data.message}`, data);
        return null;
      }
      return data.data;
    } catch (error) {
      logger.error(`Inventory item delete error: ${error}`);
      throw error;
    }
  }

}
