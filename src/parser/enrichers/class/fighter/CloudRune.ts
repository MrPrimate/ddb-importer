import DDBEnricherData from "../../data/DDBEnricherData";

export default class CloudRune extends DDBEnricherData {

  // get clearAutoEffects() {
  //   return true;
  // }

  override get activity(): IDDBActivityData {
    return {
      name: "Invoke Rune (Redirect Attack)",
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        noCreate: true,
        name: "Cloud Rune: Passive Bonuses",
        options: {
          transfer: true,
        },
        changes: [
          DDBEnricherData.ChangeHelper.advantageSkillChange("slt"),
          DDBEnricherData.ChangeHelper.advantageSkillChange("dec"),
        ],
      },
    ];
  }

  override get override(): IDDBOverrideData {
    const uses = this._getUsesWithSpent({
      name: "Cloud Rune",
      type: "class",
      max: "@scale.rune-knight.rune-uses",
    });
    return {
      uses,
    };
  }

}
