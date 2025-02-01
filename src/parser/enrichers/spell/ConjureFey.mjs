/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class ConjureFey extends DDBEnricherData {

  get type() {
    if (this.is2014) return null;
    return "summon";
  }

  get activity() {
    if (this.is2014) return null;
    return {
      type: "summon",
      noTemplate: true,
      generateSummons: !this.is2014,
      summonsFunction: DDBImporter.lib.DDBSummonsInterface.getConjureFey2024,
      profileKeys: [
        "ConjureFey",
      ],
      summons: {
        "match": {
          "proficiency": false,
          "attacks": true,
          "saves": false,
        },
        "bonuses": {
          "ac": "",
          "hp": "",
          "attackDamage": "(2 * (@item.level - 6))d12 + @mod",
          "saveDamage": "",
          "healing": "",
        },
      },
    };
  }

  get additionalActivities() {
    return [
      {
        constructor: {
          name: "Summons: Teleport and Attack",
          type: "utility",
        },
        build: {
          generateConsumption: false,
          noSpellslot: true,
          generateAttack: false,
          generateTarget: true,
          generateRange: true,
          generateDuration: true,
          durationOverride: {
            units: "inst",
            concentration: false,
          },
        },
        overrides: {
          targetType: "ally",
          activationType: "special",
          noTemplate: true,
          data: {
            range: {
              units: "ft",
              value: "30",
            },
          },
        },
      },
    ];
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
