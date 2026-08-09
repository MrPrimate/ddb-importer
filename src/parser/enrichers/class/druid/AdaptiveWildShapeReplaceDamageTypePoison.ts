import DDBEnricherData from "../../data/DDBEnricherData";

export default class AdaptiveWildShapeReplaceDamageTypePoison extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.ENCHANT;
  }

  get activity(): IDDBActivityData {
    return {
      type: DDBEnricherData.ACTIVITY_TYPES.ENCHANT,
      name: "Replace Damage Type: Poison",
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
      name: "Adaptive Wild Shape: Poison",
      activityMatch: "Replace Damage Type: Poison",
      descriptionHint: true,
      // added rather than overridden, so the form's own damage type stays available
      // and dnd5e offers both as a choice when the attack is rolled
      changes: [
        DDBEnricherData.ChangeHelper.overrideChange("{} (Poison)", 20, "name"),
        DDBEnricherData.ChangeHelper.addChange("poison", 20, "system.damage.base.types"),
      ],
    }];
  }

}
