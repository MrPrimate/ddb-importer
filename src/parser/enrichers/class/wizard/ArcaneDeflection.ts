import DDBEnricherData from "../../data/DDBEnricherData";

export default class ArcaneDeflection extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Arcane Deflection",
      activationType: "reaction",
      activationCondition: "When you are hit by an attack or fail a saving throw",
      targetType: "self",
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Arcane Deflection",
        changes: [
          DDBEnricherData.ChangeHelper.signedAddChange("2", 20, "system.attributes.ac.bonus"),
          DDBEnricherData.ChangeHelper.signedAddChange("4", 20, "system.rolls.ability.save.bonus"),
        ],
        tokenMagicChanges: [
          DDBEnricherData.ChangeHelper.tokenMagicFXChange("water-field"),
        ],
        daeSpecialDurations: ["1Save", "1Attack"],
        options: {
          durationSeconds: 6,
          description: "+2 AC against the triggering attack or +4 to the triggering save. You cannot cast spells other than cantrips until the end of your next turn.",
        },
      },
    ];
  }

  override get override(): IDDBOverrideData {
    return {
      midiManualReaction: true,
    };
  }

}
