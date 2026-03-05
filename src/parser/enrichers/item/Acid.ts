import DDBEnricherData from "../data/DDBEnricherData";

export default class Acid extends DDBEnricherData {

  get activity(): IDDBActivityData {
    return {
      type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
      addItemConsume: true,
      targetType: "creature",
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
