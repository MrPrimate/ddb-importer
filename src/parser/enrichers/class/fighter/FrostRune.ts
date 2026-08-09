import DDBEnricherData from "../../data/DDBEnricherData";

export default class FrostRune extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Invoke Rune",
      activationType: "bonus",
      targetSelf: true,
      data: {
        duration: {
          units: "minute",
          value: "10",
        },
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        noCreate: true,
        name: "Frost Rune: Passive Bonuses",
        options: {
          transfer: true,
        },
        changes: [
          DDBEnricherData.ChangeHelper.advantageSkillChange("ani"),
          DDBEnricherData.ChangeHelper.advantageSkillChange("itm"),
        ],
      },
      {
        activityMatch: "Invoke Rune",
        name: "Frost Rune",
        options: {
          transfer: false,
          durationSeconds: 600,
        },
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("+2", 20, "system.abilities.con.bonuses.check"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("+2", 20, "system.abilities.con.bonuses.save"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("+2", 20, "system.abilities.str.bonuses.check"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("+2", 20, "system.abilities.str.bonuses.save"),
        ],
      },
    ];
  }

  override get override(): IDDBOverrideData {
    const uses = this._getUsesWithSpent({
      name: "Frost Rune",
      type: "class",
      max: "@scale.rune-knight.rune-uses",
    });
    return {
      uses,
    };
  }

}
