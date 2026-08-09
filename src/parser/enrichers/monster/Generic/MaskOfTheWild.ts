import DDBEnricherData from "../../data/DDBEnricherData";

export default class MaskOfTheWild extends DDBEnricherData {

  override get type() {
    return DDBEnricherData.ACTIVITY_TYPES.CHECK;
  }

  override get activity(): IDDBActivityData {
    return {
      data: {
        check: {
          associated: ["ste"],
          ability: [],
          dc: {
            calculation: "",
            formula: "",
          },
        },
      },
    };
  }

}
