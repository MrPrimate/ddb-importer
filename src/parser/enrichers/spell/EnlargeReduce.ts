import DDBEnricherData from "../data/DDBEnricherData";

export default class EnlargeReduce extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Enlarged",
        options: {
          durationSeconds: 60,
        },
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("1d4", 20, "system.rolls.damage.mwak.bonus"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("1d4", 20, "system.rolls.damage.rwak.bonus"),
          DDBEnricherData.ChangeHelper.advantageAbilityCheckChange("str"),
          DDBEnricherData.ChangeHelper.advantageAbilitySaveChange("str"),
          DDBEnricherData.ChangeHelper.addChange("1", 20, "system.traits.size"),
        ],
      },
      {
        name: "Reduced",
        options: {
          durationSeconds: 60,
        },
        changes: [
          DDBEnricherData.ChangeHelper.subtractChange("1d4", 20, "system.rolls.damage.mwak.bonus"),
          DDBEnricherData.ChangeHelper.subtractChange("1d4", 20, "system.rolls.damage.rwak.bonus"),
          DDBEnricherData.ChangeHelper.disadvantageAbilityCheckChange("str"),
          DDBEnricherData.ChangeHelper.disadvantageAbilitySaveChange("str"),
          DDBEnricherData.ChangeHelper.subtractChange("1", 20, "system.traits.size"),
        ],
      },
    ];
  }

}
