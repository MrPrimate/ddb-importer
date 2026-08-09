import DDBEnricherData from "../../data/DDBEnricherData";

export default class HillRune extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return {
      name: "Invoke Rune",
      targetType: "self",
    };
  }

  override get override(): IDDBOverrideData {
    const uses = this._getUsesWithSpent({
      name: "Hill Rune",
      type: "class",
      max: "@scale.rune-knight.rune-uses",
    });
    return {
      uses,
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        noCreate: true,
        name: "Hill Rune: Passive Bonuses",
        options: {
          description: "You have advantage on saving throws against being poisoned.",
        },
      },
      {
        activityMatch: "Invoke Rune",
        name: "Hill Rune",
        options: {
          transfer: false,
          durationSeconds: 60,
        },
        changes: [
          DDBEnricherData.ChangeHelper.damageResistanceChange("bludgeoning"),
          DDBEnricherData.ChangeHelper.damageResistanceChange("slashing"),
          DDBEnricherData.ChangeHelper.damageResistanceChange("piercing"),
        ],
      },
    ];
  }

}
