/* eslint-disable class-methods-use-this */
import { SETTINGS } from "../../../../config/_module.mjs";
import { DDBCompendiumFolders, DDBItemImporter, utils } from "../../../../lib/_module.mjs";
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class ExperimentalElixir extends DDBEnricherData {

  get type() {
    return "utility";
  }

  get activity() {
    return {
      name: "Roll for Experimental Elixir",
      noConsumeTargets: true,
      activationType: "action",
      data: {
        roll: {
          name: "Roll for Experimental Elixir",
          formula: "1d6",
        },
      },
    };
  }

  get override() {
    if (this.is2014) return null;
    return {
      data: {
        "system.uses": {
          spent: 0,
          max: "@scale.alchemist.experimental-elixir",
          recovery: [{ period: "lr", type: 'recoverAll', formula: undefined }],
        },
        "flags.ddbimporter": {
          retainResourceConsumption: true,
          retainUseSpent: true,
        },
      },
    };
  }

  _experimentalElixirDetails = null;

  get experimentalElixirDetails() {
    if (this._experimentalElixirDetails) return this._experimentalElixirDetails;

    const dom = utils.htmlToDocumentFragment(this.ddbParser?.ddbDefinition?.description ?? "");

    // Find all rows in the tbody
    const rows = dom.querySelectorAll('tbody tr');

    const details = [];

    rows.forEach((row) => {
      const cells = row.querySelectorAll('td');
      if (cells.length < 2) return;
      const rollValue = cells[0].textContent.trim();
      const effectCell = cells[1];

      const strongTag = effectCell.querySelector('strong');
      if (!strongTag) return;

      const name = strongTag.textContent.replace(".", "").trim();
      const fullText = effectCell.textContent.trim();
      const description = fullText
        .replace(name, '')
        .replace(/^[.\s]*/, '')
        .trim();

      details.push({
        roll: rollValue,
        name,
        description,
      });
    });

    this._experimentalElixirDetails = details;

    return details;
  }

  getSkeletonItem(row) {
    const itemName = `Experimental Elixir: ${row.name}`;
    return {
      "_id": utils.namedIDStub(itemName, {
        postfix: row.roll,
        prefix: "ee",
      }),
      "name": itemName,
      "type": "consumable",
      "img": "icons/consumables/potions/bottle-round-label-cork-yellow.webp",
      "system": {
        "activities": {},
        "description": {
          "value": row.description,
          "chat": "",
        },
        "identifier": utils.referenceNameString(itemName),
        "source": {
          "revision": 1,
          "rules": this.is2014 ? "2014" : "2024",
        },
        "identified": true,
        "quantity": 1,
        "attuned": false,
        "equipped": false,
        "properties": [
          "mgc",
        ],
        "type": {
          "value": "potion",
          "subtype": "",
        },
      },
      "effects": [],
      "flags": {
        "ddbimporter": {
          "is2014": this.is2014,
          "is2024": this.is2024,
          "subClass": "Alchemist",
          "class": "Artificer",
          "experimentalElixir": true,
        },
      },
    };
  }

  get activityMap() {
    return this.is2014
      ? {
        "Healing": [
          { number: 2, denomination: 4, bonus: "@abilities.int.mod", min: null, max: null },
        ],
        "Swiftness": [
          { bonus: "10", min: null, max: null },
        ],
        "Resilience": [
          { duration: "600", min: null, max: null },
        ],
        "Boldness": [
          { duration: "69", min: null, max: null },
        ],
        "Flight": [
          { bonus: "10", min: null, max: null },
        ],
        "Transformation": [
          { duration: "10", min: null, max: null },
        ],
      }
      : {
        "Healing": [
          { number: 2, denomination: 8, bonus: "@abilities.int.mod", min: null, max: 8 },
          { number: 3, denomination: 8, bonus: "@abilities.int.mod", min: 9, max: 14 },
          { number: 4, denomination: 8, bonus: "@abilities.int.mod", min: 15, max: null },
        ],
        "Swiftness": [
          { bonus: "10", min: null, max: 8 },
          { bonus: "15", min: 9, max: 14 },
          { bonus: "20", min: 15, max: null },
        ],
        "Resilience": [
          { duration: "600", minutes: "10", min: null, max: 8 },
          { duration: "3600", minutes: "60", min: 9, max: 14 },
          { duration: "28800", minutes: "480", min: 15, max: null },
        ],
        "Boldness": [
          { duration: "60", minutes: "1", min: null, max: 8 },
          { duration: "600", minutes: "10", min: 9, max: 14 },
          { duration: "3600", minutes: "60", min: 15, max: null },
        ],
        "Flight": [
          { bonus: "10", min: null, max: 8 },
          { bonus: "20", min: 9, max: 14 },
          { bonus: "30", min: 15, max: null },
        ],
      };
  }

  enchantChangeMap(name) {
    const data = this.experimentalElixirDetails.find((e) => e.name === name);
    const result = [
      DDBEnricherData.ChangeHelper.overrideChange(`${name} Elixir`, 20, "name"),
      DDBEnricherData.ChangeHelper.overrideChange("potion", 20, "system.type.value"),
      DDBEnricherData.ChangeHelper.overrideChange("1", 20, "system.uses.max"),
      DDBEnricherData.ChangeHelper.overrideChange("charges", 20, "system.uses.per"),
      DDBEnricherData.ChangeHelper.overrideChange("true", 20, "system.uses.prompt"),
      DDBEnricherData.ChangeHelper.overrideChange("true", 20, "system.uses.autoDestroy"),
      DDBEnricherData.ChangeHelper.overrideChange(data.description, 20, "system.description.value"),
      DDBEnricherData.ChangeHelper.overrideChange("1", 20, "system.activation.cost"),
      DDBEnricherData.ChangeHelper.overrideChange((this.is2014 ? "action" : "bonus"), 20, "system.activation.type"),
    ];

    switch (name) {
      case "Healing":
        result.push(
          DDBEnricherData.ChangeHelper.overrideChange("icons/consumables/potions/bottle-round-label-cork-red.webp", 20, "img"),
          DDBEnricherData.ChangeHelper.overrideChange("", 20, "activities[heal].visibility.level.min"),
          DDBEnricherData.ChangeHelper.overrideChange("", 20, "activities[heal].visibility.level.max"),
        );
        // if (game.modules.get("dae")?.active) {
        //   result.push(DDBEnricherData.ChangeHelper.overrideChange("##abilities.int.mod", 90, "activities[heal].healing.bonus"));
        // };
        break;
      case "Swiftness":
        result.push(
          DDBEnricherData.ChangeHelper.overrideChange("icons/consumables/potions/bottle-round-label-cork-green.webp", 20, "img"),
          DDBEnricherData.ChangeHelper.overrideChange("60", 20, "system.duration.value"),
          DDBEnricherData.ChangeHelper.overrideChange("minute", 20, "system.duration.units"),
          DDBEnricherData.ChangeHelper.overrideChange("", 20, "activities[utility].visibility.level.min"),
          DDBEnricherData.ChangeHelper.overrideChange("", 20, "activities[utility].visibility.level.max"),
        );
        break;
      case "Resilience":
        result.push(
          DDBEnricherData.ChangeHelper.overrideChange("icons/consumables/potions/bottle-round-label-cork-purple.webp", 20, "img"),
          DDBEnricherData.ChangeHelper.overrideChange("10", 20, "system.duration.value"),
          DDBEnricherData.ChangeHelper.overrideChange("minute", 20, "system.duration.units"),
          DDBEnricherData.ChangeHelper.overrideChange("", 20, "activities[utility].visibility.level.min"),
          DDBEnricherData.ChangeHelper.overrideChange("", 20, "activities[utility].visibility.level.max"),
        );
        break;
      case "Boldness":
        result.push(
          DDBEnricherData.ChangeHelper.overrideChange("icons/consumables/potions/bottle-round-label-cork-yellow.webp", 20, "img"),
          DDBEnricherData.ChangeHelper.overrideChange("1", 20, "system.duration.value"),
          DDBEnricherData.ChangeHelper.overrideChange("minute", 20, "system.duration.units"),
          DDBEnricherData.ChangeHelper.overrideChange("", 20, "activities[utility].visibility.level.min"),
          DDBEnricherData.ChangeHelper.overrideChange("", 20, "activities[utility].visibility.level.max"),
        );
        break;
      case "Flight":
        result.push(
          DDBEnricherData.ChangeHelper.overrideChange("icons/consumables/potions/bottle-ornate-bat-teal.webp", 20, "img"),
          DDBEnricherData.ChangeHelper.overrideChange("10", 20, "system.duration.value"),
          DDBEnricherData.ChangeHelper.overrideChange("minute", 20, "system.duration.units"),
          DDBEnricherData.ChangeHelper.overrideChange("", 20, "activities[utility].visibility.level.min"),
          DDBEnricherData.ChangeHelper.overrideChange("", 20, "activities[utility].visibility.level.max"),
        );
        break;
      case "Transformation":
        result.push(
          DDBEnricherData.ChangeHelper.overrideChange("icons/consumables/potions/bottle-round-label-cork-blue.webp", 20, "img"),
          DDBEnricherData.ChangeHelper.overrideChange("", 20, "activities[cast].visibility.level.min"),
          DDBEnricherData.ChangeHelper.overrideChange("", 20, "activities[cast].visibility.level.max"),
        );
        break;
    // no default
    }

    return result;
  }

  generateElixirAdditionalActivity(name) {
    const results = this.activityMap[name].map((a, i) => {
      const result = {
        constructor: {
          name: `Use ${name}`,
          type: "utility",
        },
        build: {
          generateActivation: true,
          generateConsumption: true,
          consumeItem: true,
          noeffects: true,
          activationOverride: {
            type: "bonus",
            value: 1,
            condition: "",
          },
        },
        overrides: {
          noTemplate: true,
          id: utils.namedIDStub(name, {
            postfix: i,
            prefix: "eea",
          }),
          data: {
            flags: {
              ddbimporter: {
                isElixirAdditionalActivity: true,
              },
            },
          },
        },
      };

      if (a.min || a.max) {
        result.overrides.data.visibility = {
          "level": {
            "min": a.min,
            "max": a.max,
          },
          "requireAttunement": false,
          "requireIdentification": false,
          "requireMagic": false,
          "identifier": "artificer",
        };
      }

      if (name === "Healing") {
        result.constructor.type = "heal";
        result.build.generateHealing = true;
        result.build.healingPart = {
          number: a.number,
          denomination: a.denomination,
          bonus: a.bonus,
          types: ["healing"],
        };

      } else if (name === "Swiftness") {
        result.build.generateDuration = true;
        result.build.durationOverride = {
          units: "hour",
          value: 1,
        };
      } else if (name === "Resilience") {
        result.build.generateDuration = true;
        result.build.durationOverride = {
          units: "minute",
          value: a.minutes ?? 10,
        };
      } else if (name === "Boldness") {
        result.build.generateRoll = true;
        result.build.roll = {
          formula: "1d4",
          name: "Boldness Roll",
        };
        result.build.generateDuration = true;
        result.build.durationOverride = {
          units: "minute",
          value: a.minutes ?? 1,
        };
      } else if (name === "Flight") {
        result.build.generateDuration = true;
        result.build.durationOverride = {
          units: "minute",
          value: 10,
        };
      } else if (name === "Transformation") {
        result.constructor.type = "cast";
        result.build.generateDuration = true;
        result.build.durationOverride = {
          units: "minute",
          value: 10,
        };
        result.build.generateSpell = true;
        result.overrides.addSpellUuid = "Alter Self";
        result.build.spellOverride = {
          uuid: "",
          properties: [],
          level: null,
          challenge: {
            attack: null,
            save: null,
            override: false,
          },
          spellbook: false,
        };
      }
      return result;
    });

    return results;
  }

  generateElixirEffect(name) {
    const effects = [];
    if (name === "Swiftness") {
      const results = this.activityMap[name].map((data, i) => {
        return {
          name: `Experimental Elixir: ${name}`,
          activityMatch: `Use ${name}`,
          type: "item",
          options: {
            transfer: false,
          },
          changes: [
            DDBEnricherData.ChangeHelper.addChange(data.bonus, 20, "system.attributes.movement.walk"),
          ],
          data: {
            "_id": utils.namedIDStub(name, {
              postfix: i,
              prefix: "ef",
            }),
            "flags.ddbimporter.effectIdLevel": {
              min: data.min,
              max: data.max,
            },
          },
        };
      });
      effects.push(...results);
    } else if (name === "Resilience") {
      effects.push(...this.activityMap[name].map((data, i) => {
        return {
          name: `Experimental Elixir: ${name}`,
          activityMatch: `Use ${name}`,
          type: "item",
          options: {
            transfer: false,
            durationSeconds: data.duration,
          },
          changes: [
            DDBEnricherData.ChangeHelper.addChange("1", 20, "system.attributes.ac.bonus"),
          ],
          data: {
            "_id": utils.namedIDStub(name, {
              postfix: i,
              prefix: "ef",
            }),
            "flags.ddbimporter.effectIdLevel": {
              min: data.min,
              max: data.max,
            },
          },
        };
      }));
    } else if (name === "Boldness") {
      effects.push(...this.activityMap[name].map((data, i) => {
        return {
          name: `Experimental Elixir: ${name}`,
          activityMatch: `Use ${name}`,
          type: "item",
          options: {
            transfer: false,
            durationSeconds: data.duration,
          },
          changes: [
            DDBEnricherData.ChangeHelper.addChange("1d4", 20, "system.bonuses.abilities.save"),
            DDBEnricherData.ChangeHelper.addChange("1d4", 20, "system.bonuses.msak.attack"),
            DDBEnricherData.ChangeHelper.addChange("1d4", 20, "system.bonuses.mwak.attack"),
            DDBEnricherData.ChangeHelper.addChange("1d4", 20, "system.bonuses.rsak.attack"),
            DDBEnricherData.ChangeHelper.addChange("1d4", 20, "system.bonuses.rwak.attack"),
          ],
          data: {
            "_id": utils.namedIDStub(name, {
              postfix: i,
              prefix: "ef",
            }),
            "flags.ddbimporter.effectIdLevel": {
              min: data.min,
              max: data.max,
            },
          },
        };
      }));
    } else if (name === "Flight") {
      effects.push(...this.activityMap[name].map((data, i) => {
        return {
          name: `Experimental Elixir: ${name}`,
          activityMatch: `Use ${name}`,
          type: "item",
          options: {
            transfer: false,
          },
          changes: [
            DDBEnricherData.ChangeHelper.addChange(data.bonus, 20, "system.attributes.movement.fly"),
          ],
          data: {
            "_id": utils.namedIDStub(name, {
              postfix: i,
              prefix: "ef",
            }),
            "flags.ddbimporter.effectIdLevel": {
              min: data.min,
              max: data.max,
            },
          },
        };
      }));
    }

    return effects;
  }

  _elixirEffects = null;

  get getElixirEffects() {
    if (this._elixirEffects) return this._elixirEffects;

    const results = [];
    for (const row of this.experimentalElixirDetails) {
      const effects = this.generateElixirEffect(row.name);
      results.push(...effects);
    }
    this._elixirEffects = results;
    return results;

  }

  getElixirAdditionalEnchantActivityEffects(name) {
    const results = [];
    this.activityMap[name].forEach((m, i) => {
      results.push({
        name,
        type: "enchant",
        changes: this.enchantChangeMap(name),
        activitiesMatch: ["Create Elixir", "Create Elixir With Spell Slot"],
        data: {
          flags: {
            ddbimporter: {
              effectIdLevel: {
                min: m.min ?? null,
                max: m.max ?? null,
              },
              activityRiders: [utils.namedIDStub(name, {
                postfix: i,
                prefix: "eea",
              })],
              effectRiders: [],
            },
          },
        },
      });
    });

    return results;
  }

  get elixirAdditionalActivities() {
    const results = [];
    for (const row of this.experimentalElixirDetails) {
      const activities = this.generateElixirAdditionalActivity(row.name);
      results.push(...activities);
    }
    return results;
  }

  get additionalActivities() {
    const base = [
      {
        constructor: {
          name: "Create Elixir",
          type: "enchant",
        },
        overrides: {
          noTemplate: true,
          activationType: "action",
          addItemConsume: true,
          targetType: "self",
          data: {
            restrictions: {
              type: "consumable",
            },
          },
        },
      },
      {
        constructor: {
          name: "Create Elixir With Spell Slot",
          type: "enchant",
        },
        overrides: {
          activationType: "action",
          addItemConsume: true,
          targetType: "self",
          noTemplate: true,
          data: {
            restrictions: {
              type: "consumable",
            },
            consumption: {
              scaling: { allowed: true, max: "9" },
              targets: [
                {
                  type: "spellSlots",
                  value: "1",
                  target: "1",
                  scaling: { allowed: false, max: "" },
                },
              ],
            },
          },
        },
      },
    ];

    return base.concat(this.elixirAdditionalActivities);
  }


  get elixirEnchantEffects() {
    const results = [];
    for (const row of this.experimentalElixirDetails) {
      const effect = {
        name: `Experimental Elixir: ${row.name}`,
        type: "enchant",
      };
      results.push(effect);
    }
    return results;
  }

  get effects() {
    const baseEffects = [];

    baseEffects.push(...this.getElixirEffects);

    for (const row of this.experimentalElixirDetails) {
      const enchant = this.getElixirAdditionalEnchantActivityEffects(row.name);
      baseEffects.push(...enchant);
    }

    return baseEffects;
  }

  async buildItem(row) {
    const itemData = this.getSkeletonItem(row);
    for (const [key, value] of Object.entries(this.data.system.activities)) {
      if (!foundry.utils.getProperty(value, "flags.ddbimporter.isElixirAdditionalActivity")) continue;
      if (!value.name.endsWith(row.name)) continue;
      foundry.utils.setProperty(itemData, `system.activities.${key}`, value);
    }

    for (const effect of this.data.effects) {
      if (effect.name.startsWith(`Experimental Elixir: ${row.name}`)) {
        itemData.effects.push(effect);
      }
    }

    return itemData;
  }

  elixirs = [];

  static featureHandlerOptions = {
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
      ],
    },
  };

  async importElixirs() {
    const updateFeatures = this.updateCompendiumItems
      ?? this.ddbParser.ddbCharacter.forceCompendiumUpdate
      ?? game.settings.get(SETTINGS.MODULE_ID, "character-update-policy-update-add-features-to-compendiums");

    const featureHandler = await DDBItemImporter.buildHandler("features", this.elixirs, updateFeatures, ExperimentalElixir.featureHandlerOptions, this.handler);
    await featureHandler.buildIndex(ExperimentalElixir.featureHandlerOptions.indexFilter);

  }

  async buildCompendiumFolders() {
    this.compendiumFolders = new DDBCompendiumFolders("features");
    await this.compendiumFolders.loadCompendium("features");
    const versionStub = this.is2014 ? "2014" : "2024";
    await this.compendiumFolders.createSubClassFeatureFolder("Alchemist", "Artificer", versionStub);
  }

  async generateElixirs() {
    await this.buildCompendiumFolders();

    for (const row of this.experimentalElixirDetails) {
      const item = await this.buildItem(row);
      this.elixirs.push(item);
    }

    await this.compendiumFolders.addCompendiumFolderIds(this.elixirs);
    await this.importElixirs();
  }

  updateDescriptionTable(updates = []) {
    const doc = utils.htmlToDoc(this.ddbParser?.ddbDefinition?.description ?? "");

    const rows = doc.body.querySelectorAll('tbody tr');

    for (const update of updates) {
      const currentTitle = `${update.name.trim()}.`;

      for (const row of rows) {
        const cells = row.querySelectorAll('td');
        if (cells.length < 2)
          continue;

        const effectCell = cells[1];
        const strongTag = effectCell.querySelector('strong');

        if (strongTag && strongTag.textContent.trim() === currentTitle) {
          strongTag.textContent = `@UUID[${update.uuid}]{${update.name}.}`;
          break;
        }
      }
    }
    foundry.utils.setProperty(this.ddbParser, "ddbDefinition.description", doc.body.innerHTML);
  }

  linkUpItemUUIDs() {
    const updates = [];
    for (const elixir of this.elixirs) {
      const uuid = this.handler.compendiumIndex.find((e) => e._id === elixir._id)?.uuid
        ?? this.handler.compendiumIndex.find((e) => e.name === elixir.name && e.flags?.ddbimporter?.is2014 === elixir.flags?.ddbimporter?.is2014)?.uuid;
      if (!uuid) continue;
      updates.push({ name: elixir.name.split(':').pop().trim(), uuid });
    }

    this.updateDescriptionTable(updates);

  }

  async cleanup() {
    this.handler = new DDBItemImporter("features", [], ExperimentalElixir.featureHandlerOptions);
    if (game.user.isGM) await this.generateElixirs();
    this.linkUpItemUUIDs();
  }

}
