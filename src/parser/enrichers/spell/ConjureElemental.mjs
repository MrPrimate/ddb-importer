/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class ConjureElemental extends DDBEnricherData {

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
      summonsFunction: DDBImporter.lib.DDBSummonsInterface.getConjureElementals2024,
      profileKeys: [
        { count: 1, name: "ConjureElementalAir" },
        { count: 1, name: "ConjureElementalEarth" },
        { count: 1, name: "ConjureElementalFire" },
        { count: 1, name: "ConjureElementalWater" },
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
          "saveDamage": "(2 * @item.level - 10)d8",
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
