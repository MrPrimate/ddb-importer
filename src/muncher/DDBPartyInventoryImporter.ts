import { logger, CompendiumHelper, DDBCampaigns } from "../lib/_module";
import DDBPartyInventory, {
  IDDBPartyInventory,
  IDDBPartyInventoryItem,
  IDDBPartyCurrency,
} from "./DDBPartyInventory";

const FLAG_SCOPE = "ddbimporter";
const FLAG_CAMPAIGN_KEY = "partyCampaignId";
const FLAG_DDB_PARTY_ITEM_ID = "ddbPartyItemId";

const CURRENCY_KEYS: (keyof IDDBPartyCurrency)[] = ["cp", "sp", "ep", "gp", "pp"];

export default class DDBPartyInventoryImporter {

  static async findOrCreatePartyActor({
    campaignId,
    name = null,
    create = true,
  }: { campaignId: string; name?: string | null; create?: boolean }) {
    const existing = (game as any).actors.find((a: any) =>
      a.type === "group"
      && foundry.utils.getProperty(a, `flags.${FLAG_SCOPE}.${FLAG_CAMPAIGN_KEY}`) === campaignId,
    );
    if (existing) return existing;
    if (!create) return null;

    const actorName = name ?? `DDB Party (${campaignId})`;
    const actorData: any = {
      name: actorName,
      type: "group",
      flags: {
        [FLAG_SCOPE]: {
          [FLAG_CAMPAIGN_KEY]: campaignId,
          partyInventory: true,
        },
      },
    };
    const actor = await (Actor as any).create(actorData);
    return actor;
  }

  static async resolveItem(ddbItem: IDDBPartyInventoryItem) {
    const ddbId = ddbItem?.definition?.id;
    if (!ddbId) return null;
    if (ddbItem.definition?.isCustomItem) return null;

    const compendiumLabel = CompendiumHelper.getCompendiumLabel("inventory");
    const compendium = CompendiumHelper.getCompendium(compendiumLabel, false);
    if (!compendium) {
      logger.warn("No item compendium configured for party inventory lookup");
      return null;
    }

    const index = await (compendium as any).getIndex({
      fields: ["name", "type", "img", "system.quantity", "flags.ddbimporter.id", "flags.ddbimporter.definitionId"],
    });
    const match = index.find((entry: any) => {
      const fid = foundry.utils.getProperty(entry, "flags.ddbimporter.id");
      const def = foundry.utils.getProperty(entry, "flags.ddbimporter.definitionId");
      return fid === ddbId || def === ddbId;
    });
    if (!match) return null;

    const document: any = await (compendium as any).getDocument(match._id);
    return document?.toObject();
  }

  static buildItemPayload(itemDoc: any, ddbItem: IDDBPartyInventoryItem) {
    const payload = foundry.utils.duplicate(itemDoc);
    delete payload._id;

    payload.system = payload.system ?? {};
    if (typeof ddbItem.quantity === "number") {
      payload.system.quantity = ddbItem.quantity;
    }
    if (typeof ddbItem.equipped === "boolean") {
      foundry.utils.setProperty(payload, "system.equipped", ddbItem.equipped);
    }
    if (typeof ddbItem.isAttuned === "boolean") {
      foundry.utils.setProperty(payload, "system.attuned", ddbItem.isAttuned);
    }

    foundry.utils.setProperty(payload, `flags.${FLAG_SCOPE}.${FLAG_DDB_PARTY_ITEM_ID}`, ddbItem.id);
    foundry.utils.setProperty(payload, `flags.${FLAG_SCOPE}.partyItem`, true);
    foundry.utils.setProperty(payload, `flags.${FLAG_SCOPE}.containerEntityId`, ddbItem.containerEntityId ?? null);
    foundry.utils.setProperty(payload, `flags.${FLAG_SCOPE}.containerEntityTypeId`, ddbItem.containerEntityTypeId ?? null);
    foundry.utils.setProperty(payload, `flags.${FLAG_SCOPE}.equippedEntityId`, ddbItem.equippedEntityId ?? null);
    return payload;
  }

  static buildFallbackItem(ddbItem: IDDBPartyInventoryItem) {
    const def = ddbItem.definition ?? ({ id: ddbItem.id, name: `Unknown Item ${ddbItem.id}` } as any);
    const isContainer = def.isContainer === true;
    const type = isContainer ? "container" : "loot";
    const img = def.avatarUrl ?? def.largeAvatarUrl ?? "icons/svg/item-bag.svg";

    return {
      name: def.name ?? `DDB Item ${ddbItem.id}`,
      type,
      img,
      system: {
        quantity: ddbItem.quantity ?? 1,
        weight: { value: def.weight ?? 0, units: "lb" },
        price: { value: def.cost ?? 0, denomination: "gp" },
        rarity: (def.rarity ?? "").toLowerCase(),
        description: { value: def.description ?? def.snippet ?? "" },
        equipped: ddbItem.equipped ?? false,
        attuned: ddbItem.isAttuned ?? false,
      },
      flags: {
        [FLAG_SCOPE]: {
          id: def.id,
          definitionId: def.id,
          definitionKey: def.definitionKey ?? null,
          [FLAG_DDB_PARTY_ITEM_ID]: ddbItem.id,
          partyItem: true,
          containerEntityId: ddbItem.containerEntityId ?? null,
          containerEntityTypeId: ddbItem.containerEntityTypeId ?? null,
          equippedEntityId: ddbItem.equippedEntityId ?? null,
          isCustomItem: def.isCustomItem ?? false,
          fallback: true,
        },
      },
    };
  }

  static diffExistingItems(actor: any, payloads: any[]) {
    const partyItems = actor.items.filter((i: any) =>
      foundry.utils.getProperty(i, `flags.${FLAG_SCOPE}.partyItem`) === true,
    );
    const incomingByPartyId = new Map<number, any>();
    for (const payload of payloads) {
      const id = foundry.utils.getProperty(payload, `flags.${FLAG_SCOPE}.${FLAG_DDB_PARTY_ITEM_ID}`);
      if (typeof id === "number") incomingByPartyId.set(id, payload);
    }

    const updates: any[] = [];
    const creates: any[] = [];
    const deleteIds: string[] = [];

    for (const existing of partyItems) {
      const partyId = foundry.utils.getProperty(existing, `flags.${FLAG_SCOPE}.${FLAG_DDB_PARTY_ITEM_ID}`) as number;
      if (!incomingByPartyId.has(partyId)) {
        deleteIds.push(existing.id);
      }
    }

    for (const [partyId, payload] of incomingByPartyId.entries()) {
      const match = partyItems.find((i: any) =>
        foundry.utils.getProperty(i, `flags.${FLAG_SCOPE}.${FLAG_DDB_PARTY_ITEM_ID}`) === partyId,
      );
      if (match) {
        updates.push({ _id: match.id, ...payload });
      } else {
        creates.push(payload);
      }
    }

    return { updates, creates, deleteIds };
  }

  static async applyToActor(actor: any, inventory: IDDBPartyInventory, { syncCurrency = true, removeMissing = true } = {}) {
    if (!actor) throw new Error("No actor supplied to applyToActor");
    if (actor.type !== "group") throw new Error(`Actor ${actor.name} is not a group actor`);

    const items = inventory?.partyItems ?? [];
    const payloads: any[] = [];
    for (const ddbItem of items) {
      const matched = await DDBPartyInventoryImporter.resolveItem(ddbItem);
      const payload = matched
        ? DDBPartyInventoryImporter.buildItemPayload(matched, ddbItem)
        : DDBPartyInventoryImporter.buildFallbackItem(ddbItem);
      payloads.push(payload);
    }

    const { updates, creates, deleteIds } = DDBPartyInventoryImporter.diffExistingItems(actor, payloads);

    if (creates.length) await actor.createEmbeddedDocuments("Item", creates);
    if (updates.length) await actor.updateEmbeddedDocuments("Item", updates);
    if (removeMissing && deleteIds.length) await actor.deleteEmbeddedDocuments("Item", deleteIds);

    const flagUpdates: Record<string, any> = {
      [`flags.${FLAG_SCOPE}.lastPartySync`]: Date.now(),
      [`flags.${FLAG_SCOPE}.sharingState`]: inventory?.sharingState ?? null,
    };

    if (syncCurrency && inventory?.currency) {
      const currency = inventory.currency;
      for (const denom of CURRENCY_KEYS) {
        const value = currency[denom];
        if (typeof value === "number") flagUpdates[`system.currency.${denom}`] = value;
      }
    }

    await actor.update(flagUpdates);

    return { creates: creates.length, updates: updates.length, deletes: deleteIds.length };
  }

  static async pull({
    cobalt = null,
    campaignId = null,
    actor = null,
    create = true,
    syncCurrency = true,
    removeMissing = true,
  }: {
    cobalt?: string | null;
    campaignId?: string | null;
    actor?: any;
    create?: boolean;
    syncCurrency?: boolean;
    removeMissing?: boolean;
  } = {}) {
    const resolvedCampaignId = campaignId ?? DDBCampaigns.getCampaignId();
    if (!resolvedCampaignId) {
      logger.error("Cannot pull party inventory without a campaignId");
      return null;
    }

    const inventory = await DDBPartyInventory.fetchPartyInventory({ cobalt, campaignId: resolvedCampaignId });
    if (!inventory) return null;

    const targetActor = actor
      ?? await DDBPartyInventoryImporter.findOrCreatePartyActor({ campaignId: resolvedCampaignId, create });
    if (!targetActor) return null;

    const result = await DDBPartyInventoryImporter.applyToActor(targetActor, inventory, { syncCurrency, removeMissing });
    return { actor: targetActor, ...result };
  }

  static async moveItemToParty({
    cobalt = null,
    characterId,
    ddbItemId,
    campaignId = null,
  }: {
    cobalt?: string | null;
    characterId: number | string;
    ddbItemId: number | string;
    campaignId?: number | string | null;
  }) {
    const resolvedCampaignId = campaignId ?? DDBCampaigns.getCampaignId();
    if (!resolvedCampaignId) {
      logger.error("Cannot move item to party without a campaignId");
      return null;
    }
    return DDBPartyInventory.moveItemToParty({
      cobalt,
      characterId,
      id: ddbItemId,
      campaignId: resolvedCampaignId,
    });
  }

  static async moveItemToCharacter({
    cobalt = null,
    characterId,
    ddbItemId,
    targetCharacterId,
    targetContainerEntityTypeId,
  }: {
    cobalt?: string | null;
    characterId: number | string;
    ddbItemId: number | string;
    targetCharacterId: number | string;
    targetContainerEntityTypeId: number;
  }) {
    return DDBPartyInventory.moveInventoryItem({
      cobalt,
      characterId,
      id: ddbItemId,
      containerEntityId: targetCharacterId,
      containerEntityTypeId: targetContainerEntityTypeId,
    });
  }

  static async deleteItem({
    cobalt = null,
    characterId,
    ddbItemId,
    removeContainerContents = false,
    campaignId = null,
  }: {
    cobalt?: string | null;
    characterId: number | string;
    ddbItemId: number | string;
    removeContainerContents?: boolean;
    campaignId?: number | string | null;
  }) {
    return DDBPartyInventory.deleteInventoryItem({
      cobalt,
      characterId,
      id: ddbItemId,
      removeContainerContents,
      campaignId,
    });
  }

}
