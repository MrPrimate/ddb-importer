import DDBEnricherData from "../data/DDBEnricherData";

export default class Net extends DDBEnricherData {

  // the 2014 Net is a ranged weapon attack; only the 2024 Net replaces the attack with a Dexterity save
  override get type(): IDDBActivityType | null {
    if (this.is2014) return null;
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  override get activity(): IDDBActivityData | null {
    if (this.is2014) return null;
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
