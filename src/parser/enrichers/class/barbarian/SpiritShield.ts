import DDBEnricherData from "../../data/DDBEnricherData";

export default class SpiritShield extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
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
