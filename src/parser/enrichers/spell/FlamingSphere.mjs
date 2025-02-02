/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class FlamingSphere extends DDBEnricherData {

  get type() {
    return "summon";
  }

  get activity() {
    return {
      name: "Summon Sphere",
      type: "summon",
      noTemplate: true,
      generateSummons: !this.is2014,
      summonsFunction: DDBImporter.lib.DDBSummonsInterface.getFlamingSphere,
      profileKeys: [
        "FlamingSphere",
      ],
      summons: {
        "match": {
          "proficiency": false,
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
