/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class FlamingSphere extends DDBEnricherData {

  get type() {
    return "summon";
  }

  get summonsFunction() {
    return DDBImporter.lib.DDBSummonsInterface.getFlamingSphere;
  }

  get generateSummons() {
    return true;
  }

  get activity() {
    return {
      name: "Summon Sphere",
      type: "summon",
      noTemplate: true,
      profileKeys: [
        { count: 1, name: "FlamingSphere" },
      ],
      summons: {
        "match": {
          "proficiency": true,
          "attacks": false,
          "saves": true,
        },
        "bonuses": {
          "ac": "",
          "hp": "",
          "attackDamage": "",
          "saveDamage": "(@item.level)d6",
          "healing": "",
        },
      },
    };
  }


  get additionalActivities() {
    return [{
      constructor: {
        name: "Save vs Damage",
        type: "save",
      },
      build: {
        generateDamage: true,
        generateSave: true,
        generateActivation: false,
        generateConsumption: false,
        noSpellslot: true,
      },
    }];
  }

  get override() {
    return {
      data: {
        flags: {
          ddbimporter: {
            disposition: {
              match: true,
            },
          },
        },
      },
    };
  }

}
