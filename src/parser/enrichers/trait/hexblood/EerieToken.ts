import DDBEnricherData from "../../data/DDBEnricherData";
import { DDBCompendiumFolders, DDBItemImporter, utils, CompendiumHelper } from "../../../../lib/_module";


export default class EerieToken extends DDBEnricherData {
  handler: DDBItemImporter;
  compendiumFolders: DDBCompendiumFolders;
  tokens: any[] = [];

  get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.ENCHANT;
  }

  get activity(): IDDBActivityData | null {
    return {
      name: "Create Eerie Token",
      activationType: "bonus",
      targetType: "self",
      addItemConsume: true,
      data: {
        enchant: {
          self: true,
        },
      },
    };
  }

  get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Distant Message",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        overrides: {
          activationType: "action",
          overrideActivation: true,
          noConsumeTargets: true,
          data: {
            _id: "eerDistantMessag",
            img: "systems/dnd5e/icons/svg/trait-languages.svg",
            duration: {
              override: true,
              units: "inst",
            },
            range: {
              override: true,
              value: "10",
              units: "mi",
            },
            target: {
              "affects": {
                "choice": false,
                "type": "creature",
                "count": "1",
                "special": "The Token Bearer",
              },
            },
          },
        },
      },
      {
        init: {
          name: "Remote Viewing",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        overrides: {
          activationType: "action",
          data: {
            _id: "eerRemoteViewing",
            duration: {
              override: true,
              value: "1",
              units: "minute",
            },
            range: {
              override: true,
              value: "10",
              units: "mi",
            },
            target: {
              "affects": {
                "choice": false,
                "type": "object",
                "count": "1",
                "special": "The Token",
              },
            },
          },
        },
      },
    ];
  }

  get override(): IDDBOverrideData | null {
    const uses = this._getGeneratedUses({
      type: "class",
      name: "Eerie Token",
    });
    return {
      uses,
    };
  }

  get effects(): IDDBEffectHint[] {
    const compendium = CompendiumHelper.getCompendiumType("traits");
    if (!compendium) return [];
    const compendiumId = compendium?.metadata?.id;

    const itemName = `Create Eerie Token`;
    const itemId = utils.namedIDStub(itemName, {
      prefix: "eer",
    });
    const uuid = `Compendium.${compendiumId}.Item.${itemId}`;
    return [
      {
        name: `Eerie Token Created`,
        type: "enchant",
        activitiesMatch: ["Create Eerie Token"],
        changes: [
          DDBEnricherData.ChangeHelper.overrideChange("{} (Created)", 1, "name"),
          DDBEnricherData.ChangeHelper.overrideChange("Destroy Token", 1, "activities[enchant].name"),
          DDBEnricherData.ChangeHelper.overrideChange("longRest", 1, "activities[enchant].activation.type"),
          DDBEnricherData.ChangeHelper.overrideChange("[]", 1, "activities[enchant].consumption.targets"),
        ],
        data: {
          flags: {
            ddbimporter: {
              activityRiders: ["eerRemoteViewing", "eerDistantMessag"],
              itemRiders: [uuid],
            },
          },
        },
      },
      {
        name: "Remote Viewing",
        statuses: ["Incapatitated"],
        activitiesMatch: ["Remote Viewing"],
        options: {
          durationSeconds: 60,
          transfer: true,
          disabled: true,
        },
      },
    ];
  }

  static handlerOptions = {
    chrisPremades: true,
    filterDuplicates: false,
    deleteBeforeUpdate: false,
    matchFlags: ["is2014", "is2024"],
    useCompendiumFolders: true,
    indexFilter: {
      fields: [
        "name",
        "flags.ddbimporter",
        "system.type.subtype",
        "system.source.rules",
      ],
    },
  };

  async importToken() {
    const updateFeatures = this.ddbParser.ddbCharacter.updateCompendiumItems
      ?? this.ddbParser.ddbCharacter.forceCompendiumUpdate
      ?? utils.getSetting<boolean>("character-update-policy-update-add-features-to-compendiums");

    const featureHandler = await DDBItemImporter.buildHandler("features", this.tokens, updateFeatures, EerieToken.handlerOptions, this.handler);
    await featureHandler.buildIndex(EerieToken.handlerOptions.indexFilter);

  }

  async buildCompendiumFolders() {
    this.compendiumFolders = new DDBCompendiumFolders("traits");
    await this.compendiumFolders.loadCompendium("traits");
    await this.compendiumFolders.createSubTraitFolders(this.ddbParser.ddbCharacter.raw.race);
  }

  async generateToken() {
    await this.buildCompendiumFolders();

    this.tokens.push(this.TOKEN_TEMPLATE);

    await this.compendiumFolders.addCompendiumFolderIds(this.tokens);
    await this.importToken();
  }

  linkUpItemUUIDs() {
    const updates = [];
    for (const token of this.tokens) {
      const uuid = this.handler.compendiumIndex.find((e) => e._id === token._id)?.uuid
        ?? this.handler.compendiumIndex.find((e) =>
          foundry.utils.getProperty(e, "name") === token.name
          && foundry.utils.getProperty(e, "flags.ddbimporter.is2014") === token.flags?.ddbimporter?.is2014,
        )?.uuid;
      if (!uuid) continue;
      updates.push({ name: token.name.split(":").pop().trim(), uuid });
    }
  }

  async cleanup() {
    this.handler = new DDBItemImporter("traits", [], EerieToken.handlerOptions);
    if (game.user.isGM) await this.generateToken();
    this.linkUpItemUUIDs();
  }

  get TOKEN_TEMPLATE(): I5eLootItem {
    return {
      "_id": "ddbEerieToken001",
      "type": "loot",
      "name": "Magical Token",
      "system": {
        "description": {
          "value": this.data.system.description.value,
          "chat": "",
        },
        "price": {
          "value": 0,
          "denomination": "gp",
        },
        "identifier": "magical-token",
        "source": {
          "revision": 1,
          "rules": this.data.system.source.rules,
        },
        "identified": true,
        "unidentified": {
          "description": "",
        },
        "container": null,
        "quantity": 1,
        "weight": {
          "value": 0,
          "units": "lb",
        },
        "rarity": "",
        "properties": [
          "mgc",
        ],
        "type": {
          "value": "resource",
          "subtype": "",
        },
      },
      "img": "icons/commodities/treasure/trinket-totem-bone-green.webp",
      "effects": [],
      "flags": {
        "ddbimporter": {
          "is2014": this.is2014,
          "is2024": this.is2024,
          "trait": "Eerie Token",
          "species": "Hexblood",
        },
      },
      "ownership": {
        "default": 0,
      },
    };
  }

}
