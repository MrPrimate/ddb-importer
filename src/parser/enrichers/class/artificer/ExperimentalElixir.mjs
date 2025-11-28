/* eslint-disable class-methods-use-this */
import { utils } from "../../../../lib/_module.mjs";
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class ExperimentalElixir extends DDBEnricherData {

  get type() {
    return "utility";
  }

  get activity() {
    if (!this.isAction) return {};
    return {
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

  get experimentalExlixirDetails() {
    const dom = utils.htmlToDocumentFragment(this.ddbParser?.ddbDefinition?.description ?? "");

    // Find all rows in the tbody
    const rows = dom.querySelectorAll('tbody tr');

    const effects = [];

    rows.forEach((row) => {
      const cells = row.querySelectorAll('td');
      if (cells.length < 2) return;
      const rollValue = cells[0].textContent.trim();
      const effectCell = cells[1];

      const strongTag = effectCell.querySelector('strong');
      if (!strongTag) return;

      const title = strongTag.textContent.trim();
      const fullText = effectCell.textContent.trim();
      const description = fullText
        .replace(title, '')
        .replace(/^[.\s]*/, '')
        .trim();

      effects.push({
        roll: rollValue,
        title,
        description,
      });
    });

    return effects;
  }

  getSkeletonItem(row) {
    const itemName = `Experimental Elixir: ${row.name}`;
    return {
      "id": utils.namedIDStub(itemName, {
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
      "flags": {},
    };
  }

  async buildItem(row) {
    const itemData = this.getSkeletonItem(row);
    let type = "utility";
    let options = {
      generateActivation: true,
      generateConsumption: true,
      consumeItem: true,
      activationOverride: {
        type: "bonus",
        value: 1,
        condition: "",
      },
    };
    if (row.name === "Healing") {
      type = "heal";
      options.generateHealing = true;
      options.healingPart = {
        number: 2,
        denomination: 4,
        bonus: "@abilities.int.mod",
        types: ["healing"],
      };
    } else if (row.name === "Swiftness") {
      options.generateDuration = true;
      options.durationOverride = {
        units: "hour",
        value: 1,
      };
    } else if (row.name === "Resilience") {
      options.generateDuration = true;
      options.durationOverride = {
        units: "minute",
        value: 10,
      };
    } else if (row.name === "Boldness") {
      options.generateRoll = true;
      options.roll = {
        formula: "1d4",
        name: "Boldness Roll",
      };
      options.generateDuration = true;
      options.durationOverride = {
        units: "minute",
        value: 1,
      };
    } else if (row.name === "Flight") {
      options.generateDuration = true;
      options.durationOverride = {
        units: "minute",
        value: 10,
      };
    } else if (row.name === "Transformation") {
      type = "cast";
      options.generateDuration = true;
      options.durationOverride = {
        units: "minute",
        value: 10,
      };
      options.generateSpell = true;
      options.spellOverride = {
        //TODO : get spell data here
      };
    }

    const basicActivityGenerator = new DDBImporter.lib.Enrichers.mixins.DDBBasicActivity({
      actor: this.ddbEnricher.actor,
      foundryFeature: itemData,
      type,
    });
    basicActivityGenerator.build(options);

    // TODO generate and add effects
    if (row.name === "Swiftness") {

    } else if (row.name === "Resilience") {

    } else if (row.name === "Boldness") {

    } else if (row.name === "Flight") {

    }
  }

  async customFunction(options = {}) {
    for (const row of this.experimentalExlixirDetails) {
      const item = await this.buildItem(row);
    }
  }

}
