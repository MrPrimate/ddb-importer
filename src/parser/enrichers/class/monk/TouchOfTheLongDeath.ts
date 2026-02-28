import DDBEnricherData from "../../data/DDBEnricherData";

export default class TouchOfTheLongDeath extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
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
