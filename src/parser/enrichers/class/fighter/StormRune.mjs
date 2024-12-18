/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class StormRune extends DDBEnricherData {

  get activity() {
    return {
      name: "Invoke Rune: Enter Prophetic State",
      activationType: "bonus",
      targetType: "self",
      rangeSelf: true,
    };
  }

  get override() {
    const uses = this._getUsesWithSpent({
      name: "Storm Rune",
      type: "class",
      max: "@scale.rune-knight.rune-uses",
    });
    return {
      data: {
        "system.uses": uses,
      },
    };
  }

  get additionalActivities() {
    // to do return a reaction type ability
    return [];
  }

  get effects() {
    return [
      {
        noCreate: true,
        name: "Storm Rune: Passive Bonuses",
        options: {
          description: "You can't be surprised.",
        },
      },
      {
        activityMatch: "Invoke Rune: Enter Prophetic State",
        name: "Prophetic State",
        options: {
          durationSeconds: 60,
        },
      },
    ];
  }

}
