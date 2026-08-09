import DDBEnricherData from "../../data/DDBEnricherData";

export default class BendLuck extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Bend Luck Roll",
      data: {
        roll: {
          prompt: false,
          visible: true,
          formula: "1d4",
          name: "Bend Luck Roll",
        },
      },
    };
  }

}
