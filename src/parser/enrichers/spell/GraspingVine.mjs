/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class GraspingVine extends DDBEnricherData {

  get type() {
    return "summon";
  }

  get summonsFunction() {
    return DDBImporter.lib.DDBSummonsInterface.getGraspingVines2024;
  }

  get generateSummons() {
    return true;
  }

  get activity() {
    return {
      type: "summon",
      noTemplate: true,
      profileKeys: [
        { count: 1, name: "GraspingVine" },
      ],
      summons: {
        "match": {
          "proficiency": true,
          "attacks": true,
          "saves": true,
        },
        "bonuses": {
          "ac": "",
          "hp": "",
          "attackDamage": "(@item.level)d8",
          "saveDamage": "",
          "healing": "",
        },
      },
    };
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
