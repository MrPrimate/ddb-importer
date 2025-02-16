/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class FingerOfDeath extends DDBEnricherData {

  get summonsFunction() {
    return DDBImporter.lib.DDBSummonsInterface.getFingerOfDeath;
  }

  get generateSummons() {
    return true;
  }

  get additionalActivities() {
    return [
      {
        constructor: {
          name: "Place Zombie",
          type: "summon",
        },
        build: {
          generateSummon: true,
        },
        overrides: {
          noTemplate: true,
          profileKeys: this.is2014
            ? [
              { count: 1, name: "FingerOfDeathZombie2014" },
            ]
            : [
              { count: 1, name: "FingerOfDeathZombie2024" },
            ],
          summons: {
            "match": {
              "proficiency": false,
              "attacks": false,
              "saves": false,
            },
            "bonuses": {
              "ac": "",
              "hp": "",
              "attackDamage": "",
              "saveDamage": "",
              "healing": "",
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
