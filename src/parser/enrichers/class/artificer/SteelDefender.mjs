/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class SteelDefender extends DDBEnricherData {

  get activity() {
    if (this.is2014) {
      return {
        noConsumeTargets: true,
        noTemplate: true,
      };
    } else {
      return {
        targetType: "self",
        noConsumeTargets: true,
        noTemplate: true,
        data: {
          bonuses: {
            "ac": "@abilities.int.mod",
            "hp": "@classes.artificer.levels * 5",
            "attackDamage": "@abilities.int.mod",
            "healing": "@abilities.int.mod",
          },
        },
      };
    }
  }

  get override() {
    return {
      data: {
        "system.uses": {
          spent: null,
          max: "",
          recovery: [],
        },
      },
    };
  }

}
