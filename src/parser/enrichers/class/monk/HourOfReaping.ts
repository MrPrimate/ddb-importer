import DDBEnricherData from "../../data/DDBEnricherData";

export default class HourOfReaping extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  get activity(): IDDBActivityData {
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
