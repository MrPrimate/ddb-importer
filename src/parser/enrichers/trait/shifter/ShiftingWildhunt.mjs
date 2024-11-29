/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class ShiftingWildhunt extends DDBEnricherData {
  get type() {
    return "heal";
  }

  get activity() {
    return {
      activationType: "bonus",
      targetType: "self",
      data: {
        healing: DDBEnricherData.basicDamagePart({
          customFormula: "@prof * 2",
          types: ["temphp"],
        }),
      },
    };
  }

  get effects() {
    return [{
      name: "Shifted: Wildhunt",
    }];
  }

  get additionalActivities() {
    return [];
  }

  get override() {
    return {
      data: {
        "system.uses": this._getUsesWithSpent({
          type: "race",
          name: "Shift",
          max: "@prof",
        }),
      },
    };
  }
}
