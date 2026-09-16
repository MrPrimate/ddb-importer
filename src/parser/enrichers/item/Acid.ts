import DDBEnricherData from "../data/DDBEnricherData";

export default class Acid extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return {
      type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
      addItemConsume: true,
      targetType: "creature",
      data: {
        save: {
          ability: ["dex"],
          dc: {
            calculation: "dex",
            formula: "",
          },
        },
      },
    };
  }

}
