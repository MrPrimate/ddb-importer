/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class TouchOfTheLongDeath extends DDBEnricherData {

  get type() {
    return "save";
  }

  get activity() {
    return {
      addScalingMode: "amount",
      itemConsumeTargetName: this.is2014 ? "Ki" : "Monk's Focus",
      addItemConsume: true,
      addScalingFormula: "1",
      data: {
        save: {
          ability: ["con"],
          dc: { calculation: "wis", formula: "" },
        },
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({
              customFormula: "(@scaling)d10",
              type: "necrotic",
            }),
          ],
        },
        consumption: {
          spellSlot: true,
          scaling: {
            allowed: true,
            max: "10",
          },
        },
      },
    };
  }

}
