import DDBEnricherData from "../../data/DDBEnricherData";

export default class WeakeningBreath extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Weakened",
        options: {
          durationSeconds: 60,
          description: "Disadvantage on Strength-based attack rolls, checks, and saving throws.",
        },
        changes: [
          DDBEnricherData.ChangeHelper.disadvantageAbilityAttackChange("str"),
          DDBEnricherData.ChangeHelper.disadvantageAbilityCheckChange("str"),
          DDBEnricherData.ChangeHelper.disadvantageAbilitySaveChange("str"),
        ],
      },
    ];
  }

}
