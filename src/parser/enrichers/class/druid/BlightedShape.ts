import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * +2 AC and 60 ft darkvision while in Wild Shape. The Wild Shape effect enhancer applies the
 * effect automatically when the druid transforms; the activity is the manual route.
 */
export default class BlightedShape extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Apply Blighted Shape",
      activationType: "special",
      activationCondition: "When you use Wild Shape",
      targetType: "self",
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Blighted Shape Changes",
        atlChanges: [
          DDBEnricherData.ChangeHelper.atlChange("ATL.sight.range", CONST.ACTIVE_EFFECT_MODES.ADD, 60, 5),
          DDBEnricherData.ChangeHelper.atlChange("ATL.sight.visionMode", CONST.ACTIVE_EFFECT_MODES.OVERRIDE, "darkvision", 5),
        ],
        options: {
          description: "You gain +2 AC Bonus in Wild Shape",
        },
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("2", 20, "system.attributes.ac.bonus"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("60", 20, "system.attributes.senses.darkvision"),
        ],
      },
    ];
  }

}
