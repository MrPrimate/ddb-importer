import DDBEnricherData from "../../data/DDBEnricherData";

export default class StormRune extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return {
      name: "Invoke Rune: Enter Prophetic State",
      activationType: "bonus",
      targetType: "self",
      rangeSelf: true,
    };
  }

  override get override(): IDDBOverrideData {
    const uses = this._getUsesWithSpent({
      name: "Storm Rune",
      type: "class",
      max: "@scale.rune-knight.rune-uses",
    });
    return {
      uses,
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    // to do return a reaction type ability
    return [];
  }

  override get effects(): IDDBEffectHint[] {
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
