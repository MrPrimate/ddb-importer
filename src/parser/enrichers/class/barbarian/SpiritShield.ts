import DDBEnricherData from "../../data/DDBEnricherData";

export default class SpiritShield extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity() {
    return {
      activationType: "reaction",
      data: {
        roll: {
          name: "Reduce Damage",
          formula: "@scale.ancestral-guardian.spirit-shield",
        },
      },
    };
  }

}
