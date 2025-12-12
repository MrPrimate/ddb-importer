/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class BladeOfDisaster extends DDBEnricherData {

  get type() {
    return "summon";
  }

  get summonsFunction() {
    return DDBImporter.lib.DDBSummonsInterface.getBladeOfDisaster;
  }

  get generateSummons() {
    return true;
  }

  get activity() {
    return {
      type: "summon",
      noTemplate: true,
      profileKeys: [
        { count: 1, name: "BladeOfDisaster" },
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
          "attackDamage": "",
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
