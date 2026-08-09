import DDBEnricherData from "../../data/DDBEnricherData";

export default class HourOfReaping extends DDBEnricherData {

  override get type() {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  override get activity(): IDDBActivityData {
    return {
      data: {
        save: {
          ability: ["wis"],
          dc: { calculation: "wis", formula: "" },
        },
      },
    };
  }

}
