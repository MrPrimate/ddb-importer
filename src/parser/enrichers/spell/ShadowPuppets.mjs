/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class ShadowPuppets extends DDBEnricherData {

  get useDefaultAdditionalActivities() {
    return true;
  }

  get addToDefaultAdditionalActivities() {
    return true;
  }

  get activity() {
    if (!["save", "attack"].includes(this.ddbEnricher?._originalActivity?.type)) return null;
    return {
      name: this.ddbEnricher?._originalActivity?.type === "save" ? "Save vs Incapacitation" : "Bonus Attack",
      noSpellslot: true,
      noeffect: this.ddbEnricher?._originalActivity?.type !== "save",
      activationType: this.ddbEnricher?._originalActivity?.type === "save" ? "special" : "bonus",
      data: {
        sort: this.ddbEnricher?._originalActivity?.type === "save" ? "2" : "3",
      },
    };
  }

  get additionalActivities() {
    return [
      {
        constructor: {
          name: "Cast",
          type: "attack",
        },
        build: {
          generateConsumption: true,
          generateTarget: true,
          generateRange: true,
          generateDamage: true,
        },
        overrides: {
          data: {
            sort: "1",
          },
        },
      },
    ];
  }

  get clearAutoEffects() {
    return true;
  }

  get effects() {
    return [
      {
        activityMatch: "Cast",
        name: "Animated Shadow",
      },
      {
        activityMatch: "Save vs Incapacitation",
        name: "Incapacitated",
        statuses: ["Incapacitated"],
      },
    ];
  }

}
