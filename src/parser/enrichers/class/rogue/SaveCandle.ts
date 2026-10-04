import DDBEnricherData from "../../data/DDBEnricherData";

/** Waxwork Rogue (2014 Spirit Flame): falling prone with the candle lit needs a DC 15 Dexterity save to keep it burning. */
export default class SaveCandle extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "self",
      activationType: "special",
      activationCondition: "You fall prone while the candle burns",
      noTemplate: true,
      data: {
        save: { ability: ["dex"], dc: { calculation: "", formula: "15" } },
      },
    };
  }

}
