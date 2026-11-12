import DDBEnricherData from "../../data/DDBEnricherData";

export default class SpiritShield extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity(): IDDBActivityData {
    return {
      activationType: "reaction",
      data: {
        roll: {
          name: "Reduce Damage",
          formula: `@scale.${this.subclassIdentifier("Path of the Ancestral Guardian")}.spirit-shield`,
        },
      },
    };
  }

}
