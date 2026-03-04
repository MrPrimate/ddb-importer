import DDBEnricherData from "../../data/DDBEnricherData";

export default class HillRune extends DDBEnricherData {

  get activity() {
    return {
      name: "Invoke Rune",
      targetType: "self",
    };
  }

  get override(): IDDBOverrideData {
    const uses = this._getUsesWithSpent({
      name: "Hill Rune",
      type: "class",
      max: "@scale.rune-knight.rune-uses",
    });
    return {
      uses,
    };
  }

  get effects(): IDDBEffectHint[] {
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
