import { logger, CompendiumHelper } from "../../../../lib/_module";
import { DDBBasicActivity } from "../../../activities/_module";
import SystemHelpers from "../../../lib/SystemHelpers";
import DDBEnricherData from "../../data/DDBEnricherData";

interface IPrototypeSelection {
  slotFeatureId: number;
  slotFeatureName: string;
  ddbSpellId: number;
  imbuedLevel: number | null;
}

export default class ArcanePrototype extends DDBEnricherData {

  static SLOT_NAME_REGEX = /^Arcane Prototype: Artificer Level \d+$/i;

  get activity(): IDDBActivityData {
    return {
      type: DDBEnricherData.ACTIVITY_TYPES.DDBMACRO,
      data: {
        macro: {
          name: "Create Arcane Prototype",
          function: "ddb.feat.arcanePrototype",
          visible: false,
          parameters: "",
        },
      },
    };
  }

  get override(): IDDBOverrideData {
    return {
      data: {
        system: {
          uses: {
            spent: 0,
            max: "@scale.maverick.arcane-charges",
            recovery: [{ period: "lr", type: "recoverAll", formula: undefined }],
          },
        },
      },
    };
  }

  _getPrototypeSlotFeatureIds(): { id: number; name: string }[] {
    const ddb = this.ddbParser.ddbData;
    const slots: { id: number; name: string }[] = [];
    for (const klass of ddb.character?.classes ?? []) {
      for (const feature of klass.classFeatures ?? []) {
        const name = feature?.definition?.name ?? "";
        if (ArcanePrototype.SLOT_NAME_REGEX.test(name)) {
          slots.push({ id: feature.definition.id, name });
        }
      }
    }
    return slots;
  }

  _getPrototypeSelections(): IPrototypeSelection[] {
    const ddb = this.ddbParser.ddbData;
    const choices = ddb.character?.choices?.class ?? [];
    const options = ddb.character?.options?.class ?? [];
    const slots = this._getPrototypeSlotFeatureIds();

    const results: IPrototypeSelection[] = [];
    for (const slot of slots) {
      const outer = choices.find((c: any) =>
        c.componentId === slot.id && c.parentChoiceId === null && c.optionValue != null,
      );
      if (!outer) continue;

      const optionDef = options.find((o: any) => o.definition?.id === outer.optionValue);
      const chargeMatch = optionDef?.definition?.name?.match(/Arcane Charge:\s*(\d+)/i);
      const imbuedLevel = chargeMatch ? Number(chargeMatch[1]) : null;

      const spellChoice = choices.find((c: any) =>
        c.parentChoiceId === outer.id && c.label === "Choose a Spell" && c.optionValue != null,
      );
      if (!spellChoice) continue;

      results.push({
        slotFeatureId: slot.id,
        slotFeatureName: slot.name,
        ddbSpellId: spellChoice.optionValue,
        imbuedLevel,
      });
    }
    return results;
  }

  _lookupDDBSpell(ddbSpellId: number): { name: string; level: number } | null {
    const ddb = this.ddbParser.ddbData;
    const classSpells = ddb.character?.classSpells ?? [];
    for (const playerClass of classSpells) {
      const buckets = [
        playerClass.spells ?? [],
        playerClass.alwaysPreparedSpells ?? [],
        playerClass.alwaysKnownSpells ?? [],
      ];
      for (const bucket of buckets) {
        const found = bucket.find((s: any) => s?.definition?.id === ddbSpellId);
        if (found) {
          return { name: found.definition.name, level: found.definition.level ?? 0 };
        }
      }
    }
    const flatSpells = ddb.character?.spells?.class ?? [];
    const found = flatSpells.find((s: any) => s?.definition?.id === ddbSpellId);
    if (found) return { name: found.definition.name, level: found.definition.level ?? 0 };
    return null;
  }

  async _resolveSpellUuid(name: string): Promise<{ uuid: string; img?: string } | null> {
    try {
      const matches = await CompendiumHelper.retrieveCompendiumSpellReferences([name], {
        use2024Spells: this.is2024 ?? false,
      });
      if (matches?.length) return { uuid: matches[0].uuid, img: matches[0].img };
    } catch (err) {
      logger.warn(`ArcanePrototype: spell compendium lookup failed for "${name}"`, err);
    }
    return null;
  }

  _buildPrototypeItem({ spellName, spellUuid, spellImg, imbuedLevel, ddbSpellId }: {
    spellName: string;
    spellUuid: string;
    spellImg?: string;
    imbuedLevel: number;
    ddbSpellId: number;
  }): any {
    const baseSystem = SystemHelpers.getTemplate("consumable");
    return {
      _id: foundry.utils.randomID(),
      name: `Arcane Prototype: ${spellName}`,
      type: "consumable",
      img: spellImg ?? "icons/sundries/scrolls/scroll-bound-sealed-red.webp",
      system: foundry.utils.mergeObject(baseSystem, {
        type: { value: "trinket" },
        description: {
          value: `<p>An experimental arcane prototype imbued with <em>${spellName}</em> at level ${imbuedLevel}.</p>`
            + `<p>Only its creator can use it; once cast, it crumbles to dust unless preserved by expending a spell slot of equal level.</p>`,
        },
        quantity: 1,
        weight: { value: 0 },
        rarity: "common",
        uses: { spent: 0, max: "1", autoDestroy: true, recovery: [] },
        properties: ["mgc"],
        identified: true,
        activities: {},
      }),
      flags: {
        ddbimporter: {
          arcanePrototype: { spellUuid, imbuedLevel, ddbSpellId, source: "ddb-import" },
        },
      },
      effects: [],
    };
  }

  async _attachCastActivities(item: any, { spellName, spellUuid, imbuedLevel }: {
    spellName: string;
    spellUuid: string;
    imbuedLevel: number;
  }): Promise<void> {
    const spellOverride = {
      uuid: spellUuid,
      properties: ["vocal", "somatic"],
      level: imbuedLevel,
      challenge: { attack: null, save: null, override: false },
      spellbook: false,
    };

    await DDBBasicActivity.createActivity(
      {
        type: DDBEnricherData.ACTIVITY_TYPES.CAST,
        character: this.ddbParser,
        document: item,
        name: `Cast ${spellName} (Destroy Prototype)`,
      },
      {
        generateActivation: false,
        generateTarget: false,
        generateDuration: false,
        generateRange: false,
        generateUses: false,
        generateSpell: true,
        spellOverride,
        consumeItem: true,
        generateConsumption: true,
      },
    );

    await DDBBasicActivity.createActivity(
      {
        type: DDBEnricherData.ACTIVITY_TYPES.CAST,
        character: this.ddbParser,
        document: item,
        name: `Cast ${spellName} (Spell Slot)`,
      },
      {
        generateActivation: false,
        generateTarget: false,
        generateDuration: false,
        generateRange: false,
        generateUses: false,
        generateSpell: true,
        spellOverride,
        generateConsumption: true,
        consumptionTargetOverrides: [
          {
            type: "spellSlots",
            target: String(imbuedLevel),
            value: 1,
            scaling: { mode: "", formula: "" },
          },
        ],
      },
    );
  }

  async cleanup() {
    const selections = this._getPrototypeSelections();
    if (selections.length === 0) return;

    const items: any[] = [];
    let totalSpent = 0;

    for (const sel of selections) {
      const spell = this._lookupDDBSpell(sel.ddbSpellId);
      if (!spell) {
        logger.warn(`ArcanePrototype: could not resolve DDB spell id ${sel.ddbSpellId} for slot "${sel.slotFeatureName}"`);
        continue;
      }
      const compendiumSpell = await this._resolveSpellUuid(spell.name);
      if (!compendiumSpell) {
        logger.warn(`ArcanePrototype: could not find "${spell.name}" in the ddb-spells compendium`);
        continue;
      }
      const imbuedLevel = sel.imbuedLevel ?? spell.level ?? 1;

      const item = this._buildPrototypeItem({
        spellName: spell.name,
        spellUuid: compendiumSpell.uuid,
        spellImg: compendiumSpell.img,
        imbuedLevel,
        ddbSpellId: sel.ddbSpellId,
      });
      await this._attachCastActivities(item, {
        spellName: spell.name,
        spellUuid: compendiumSpell.uuid,
        imbuedLevel,
      });

      items.push(item);
      totalSpent += imbuedLevel;
    }

    if (items.length === 0) return;

    const factory = this.ddbParser.ddbCharacter?._characterFeatureFactory;
    if (factory?.parsed?.features) {
      factory.parsed.features.push(...items);
    } else {
      logger.warn("ArcanePrototype: _characterFeatureFactory.parsed.features unavailable; skipping push");
    }

    foundry.utils.setProperty(this.data, "system.uses.spent", totalSpent);

    logger.info(`ArcanePrototype: imported ${items.length} prototype${items.length === 1 ? "" : "s"} (${totalSpent} charge${totalSpent === 1 ? "" : "s"} spent)`);
  }

}
