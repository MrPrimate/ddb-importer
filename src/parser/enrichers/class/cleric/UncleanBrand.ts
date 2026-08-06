import DDBEnricherData from "../../data/DDBEnricherData";

export default class UncleanBrand extends DDBEnricherData {

  get useDefaultAdditionalActivities() {
    return true;
  }

  get activity(): IDDBActivityData | null {
    if (!this.isAction) return null;
    return {
      addItemConsume: true,
      itemConsumeTargetName: "Channel Divinity",
      targetType: "creature",
      activationCondition: "When you hit a creature with a Melee weapon attack or Unarmed Strike",
    };
  }

  get effects(): IDDBEffectHint[] {
    if (!this.isAction) return [];
    return [
      {
        name: "Unclean Brand",
        options: {
          durationSeconds: 60,
          description: "Disadvantage on saving throws against the cleric's spells, and Vulnerability to Fire damage the cleric deals (even if normally Resistant or Immune).",
        },
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("fire", 20, "system.traits.dv.value"),
        ],
        midiChanges: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("1", 20, "flags.midi-qol.disadvantage.ability.save.all"),
        ],
      },
    ];
  }

}
