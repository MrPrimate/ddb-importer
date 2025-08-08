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
      noeffect: true,
      activationType: this.ddbEnricher?._originalActivity?.type === "save" ? "special" : "bonus",
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
          noeffects: true,
        },
        overrides: {
          data: {
            sort: "1",
          },
        },
      },
    ];
  }

  get effects() {
    return [
      {
        activityMatch: "Cast",
        name: "Animated Shadow",
      },
    ];
  }

}
