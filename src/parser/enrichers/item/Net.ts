import DDBEnricherData from "../data/DDBEnricherData";

export default class Net extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  get activity() {
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
