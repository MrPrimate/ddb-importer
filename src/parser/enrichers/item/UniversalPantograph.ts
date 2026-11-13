import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Universal Pantograph: Arcana Unleashed item, once Clone has been cast the clone
 * grows inside the pantograph, an enchantment that renames it, hides the Clone cast, and turns the
 * activity into Complete Clone Growth, which ends it after the clone's 120 days.
 */
export default class UniversalPantograph extends DDBEnricherData {

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: { name: "Grow Clone", type: DDBEnricherData.ACTIVITY_TYPES.ENCHANT },
        build: { generateActivation: true, generateConsumption: false },
        overrides: {
          activationType: "special",
          activationCondition: "After the Clone spell's casting time is completed",
          noConsumeTargets: true,
          noTemplate: true,
          targetType: "self",
          allowMagical: true,
          data: {
            enchant: { self: true },
          },
        },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Grow Clone",
        type: "enchant",
        activityMatch: "Grow Clone",
        options: {
          description: "Use Complete Clone Growth after 120 days have passed to complete the clone's growth and restore the pantograph to normal operation.",
        },
        changes: [
          DDBEnricherData.ChangeHelper.overrideChange("Complete Clone Growth", 20, "activities[enchant].name"),
          DDBEnricherData.ChangeHelper.overrideChange("0", 20, "activities[cast].visibility.level.max"),
          DDBEnricherData.ChangeHelper.overrideChange("Clone Growth in Progress", 20, "name"),
        ],
      },
    ];
  }

}
