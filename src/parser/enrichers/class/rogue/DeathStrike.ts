import DDBEnricherData from "../../data/DDBEnricherData";

export default class DeathStrike extends DDBEnricherData {

  override get type() {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "creature",
      activationType: "special",
      activationCondition: "Hit with Sneak Attack in first round",
      data: {
        save: {
          ability: ["con"],
          dc: {
            calculation: "dex",
            formula: "",
          },
        },
      },
    };
  }

}
