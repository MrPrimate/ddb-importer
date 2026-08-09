import DDBEnricherData from "../../data/DDBEnricherData";

export default class AdaptiveWildShapeReplaceDamageTypeAcid extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.ENCHANT;
  }

  get activity(): IDDBActivityData {
    return {
      type: DDBEnricherData.ACTIVITY_TYPES.ENCHANT,
      name: "Replace Damage Type: Acid",
      activationType: "special",
      noTemplate: true,
      data: {
        restrictions: {
          type: "weapon",
          allowMagical: true,
        },
      },
    };
  }

  get effects(): IDDBEffectHint[] {
    return [{
      type: "enchant",
      name: "Adaptive Wild Shape: Acid",
      activityMatch: "Replace Damage Type: Acid",
      descriptionHint: true,
      // added rather than overridden, so the form's own damage type stays available
      // and dnd5e offers both as a choice when the attack is rolled
      changes: [
        DDBEnricherData.ChangeHelper.overrideChange("{} (Acid)", 20, "name"),
        DDBEnricherData.ChangeHelper.addChange("acid", 20, "system.damage.base.types"),
      ],
    }];
  }

}
