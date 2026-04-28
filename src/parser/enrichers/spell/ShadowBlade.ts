import { SETTINGS } from "../../../config/_module";
import { DDBCompendiumFolders, DDBItemImporter, CompendiumHelper, utils } from "../../../lib/_module";
import DDBEnricherData from "../data/DDBEnricherData";

interface IShadowBladeVariant {
  tier: string;
  minSlot: number;
  maxSlot: number;
  number: number;
}

export default class ShadowBlade extends DDBEnricherData {
  handler: DDBItemImporter;
  compendiumFolders: DDBCompendiumFolders;
  shadowBlades: any[] = [];

  static VARIANTS: IShadowBladeVariant[] = [
    { tier: "2d8", minSlot: 2, maxSlot: 2, number: 2 },
    { tier: "3d8", minSlot: 3, maxSlot: 4, number: 3 },
    { tier: "4d8", minSlot: 5, maxSlot: 6, number: 4 },
    { tier: "5d8", minSlot: 7, maxSlot: 9, number: 5 },
  ];

  static handlerOptions = {
    chrisPremades: false,
    filterDuplicates: false,
    deleteBeforeUpdate: false,
    matchFlags: ["is2014", "is2024", "shadowBlade", "shadowBladeTier"],
    useCompendiumFolders: true,
    indexFilter: {
      fields: [
        "name",
        "flags.ddbimporter",
        "system.source.rules",
      ],
    },
  };

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.ENCHANT;
  }

  get activity(): IDDBActivityData {
    return {
      data: {
        name: "Cast",
        targetType: "self",
        enchant: {
          self: true,
        },
      },
    };
  }

  get effects(): IDDBEffectHint[] {
    const compendium = CompendiumHelper.getCompendiumType("items");
    if (!compendium) return [];
    const compendiumId = compendium?.metadata?.id;
    return ShadowBlade.VARIANTS.map((v) => {
      const itemName = `Shadow Blade (${v.tier})`;
      const itemId = utils.namedIDStub(itemName, {
        prefix: "sb",
        postfix: v.tier,
      });
      const uuid = `Compendium.${compendiumId}.Item.${itemId}`;

      return {
        name: `Wielding Shadow Blade (${v.tier})`,
        type: "enchant",
        activitiesMatch: ["Cast"],
        data: {
          flags: {
            ddbimporter: {
              effectIdLevel: {
                min: v.minSlot,
                max: v.maxSlot,
              },
              itemRiders: [uuid],
            },
          },
        },
      };
    });
  }

  getShadowBladeWeapon(variant: IShadowBladeVariant) {
    const itemName = `Shadow Blade (${variant.tier})`;
    return {
      "_id": utils.namedIDStub(itemName, {
        prefix: "sb",
        postfix: variant.tier,
      }),
      "name": itemName,
      "type": "weapon",
      "img": "icons/weapons/swords/sword-flanged-lightning.webp",
      "system": {
        "identifier": utils.referenceNameString(itemName),
        "description": {
          "value": `<p>A magical sword of solidified gloom conjured by the <em>Shadow Blade</em> spell. Deals ${variant.tier} psychic damage on a hit. Use this variant when casting Shadow Blade with a spell slot of level ${variant.minSlot}${variant.minSlot === variant.maxSlot ? "" : `-${variant.maxSlot}`}.</p>`,
          "chat": "",
        },
        "source": {
          "revision": 1,
          "rules": this.is2014 ? "2014" : "2024",
        },
        "identified": true,
        "quantity": 1,
        "equipped": true,
        "proficient": 1,
        "properties": ["fin", "lgt", "thr", "mgc"],
        "type": {
          "value": "simpleM",
          "baseItem": "",
        },
        "range": {
          "value": 20,
          "long": 60,
          "units": "ft",
        },
        "damage": {
          "base": {
            "number": variant.number,
            "denomination": 8,
            "types": ["psychic"],
            "bonus": "",
          },
        },
        "attack": {
          "ability": "",
        },
      },
      "effects": [],
      "flags": {
        "ddbimporter": {
          "is2014": this.is2014,
          "is2024": this.is2024,
          "isSpellItem": true,
          "spellName": "Shadow Blade",
          "shadowBlade": true,
          "shadowBladeTier": variant.tier,
        },
      },
    };
  }

  async importShadowBlades() {
    const updateBool = this.ddbParser?.ddbCharacter?.updateCompendiumItems
      ?? this.ddbParser?.ddbCharacter?.forceCompendiumUpdate
      ?? game.settings.get(SETTINGS.MODULE_ID, "character-update-policy-update-add-features-to-compendiums");

    const handler = await DDBItemImporter.buildHandler(
      "spells",
      this.shadowBlades,
      updateBool,
      ShadowBlade.handlerOptions,
      this.handler,
    );
    await handler.buildIndex(ShadowBlade.handlerOptions.indexFilter);
  }

  async generateShadowBlades() {
    this.compendiumFolders = new DDBCompendiumFolders("items");
    await this.compendiumFolders.loadCompendium("items");

    for (const variant of ShadowBlade.VARIANTS) {
      this.shadowBlades.push(this.getShadowBladeWeapon(variant));
    }

    await this.compendiumFolders.createSpellFoldersForItemDocuments(this.shadowBlades);
    await this.compendiumFolders.addCompendiumFolderIds(this.shadowBlades);
    await this.importShadowBlades();
  }

  linkUpItemUUIDs() {
    const links: string[] = [];
    for (const blade of this.shadowBlades) {
      const uuid = this.handler.compendiumIndex.find((e: any) => e._id === blade._id)?.uuid
        ?? this.handler.compendiumIndex.find((e: any) =>
          foundry.utils.getProperty(e, "name") === blade.name
          && foundry.utils.getProperty(e, "flags.ddbimporter.is2014") === blade.flags?.ddbimporter?.is2014,
        )?.uuid;
      if (!uuid) continue;
      const variant = ShadowBlade.VARIANTS.find((v) => v.tier === blade.flags?.ddbimporter?.shadowBladeTier);
      const slotRange = variant && variant.minSlot === variant.maxSlot
        ? `slot ${variant.minSlot}`
        : `slots ${variant?.minSlot}-${variant?.maxSlot}`;
      links.push(`@UUID[${uuid}]{${blade.name}} (${slotRange})`);
    }

    console.warn("Linking up Shadow Blade item UUIDs", { links });

    if (links.length === 0) return;

    const description = this.data.system.description.value ?? "";
    const linkBlock = `<p><strong>Conjured Weapon Variants:</strong> ${links.join(", ")}.</p>`;

    if (description.includes("Conjured Weapon Variants:")) {
      const replaced = description.replace(
        /<p><strong>Conjured Weapon Variants:<\/strong>.*?<\/p>/,
        linkBlock,
      );
      foundry.utils.setProperty(this.data, "system.description.value", replaced);
    } else {
      foundry.utils.setProperty(this.data, "system.description.value", `${description}${linkBlock}`);
    }
  }

  async cleanup() {
    this.handler = new DDBItemImporter("items", [], ShadowBlade.handlerOptions);
    if (game.user.isGM) await this.generateShadowBlades();
    this.linkUpItemUUIDs();
  }
}
