import DDBEnricherData from "../data/DDBEnricherData";

export default class Net extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  override get activity(): IDDBActivityData {
    return {
      noTemplate: true,
      noConsumeTargets: true,
      targetType: "creature",
      data: {
        range: {
          value: "15",
          units: "ft",
        },
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
