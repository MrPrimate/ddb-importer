import DDBEnricherData from "../../data/DDBEnricherData";

export default class StunningStrike extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  get activity(): IDDBActivityData {
    return {
      targetType: "creature",
      activationType: "special",
      data: {
        "range.units": "touch",
        save: {
          ability: ["con"],
          dc: {
            calculation: "wis",
            formula: "",
          },
        },
      },
    };
  }

}
