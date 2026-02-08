/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class HeartOfTheStorm extends DDBEnricherData {

  get type() {
    return "damage";
  }

  get activity() {
    return {
      name: "Damage",
      noeffect: true,
      targetType: "enemy",
      activationType: "special",
      data: {
        range: {
          value: "10",
          units: "ft",
        },
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({
              customFormula: "@classes.sorcerer.levels",
              types: ["lightning", "thunder"],
            }),
          ],
        },
      },
    };
  }
}
