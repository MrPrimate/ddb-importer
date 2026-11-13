import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Staff of the Lost: Arcana Unleashed item, after its final charge is spent the
 * staff can lose its magic, an enchantment that turns it into a plain Quarterstaff and hides its
 * spells. Using the activity again restores it.
 */
export default class StaffOfTheLost extends DDBEnricherData {

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: { name: "Exhaust Staff", type: DDBEnricherData.ACTIVITY_TYPES.ENCHANT },
        build: { generateActivation: true, generateConsumption: false },
        overrides: {
          activationType: "special",
          activationCondition: "After expending the final charge",
          noConsumeTargets: true,
          noTemplate: true,
          targetType: "self",
          allowMagical: true,
          data: {
            enchant: { self: true },
            restrictions: { type: "weapon", allowMagical: true },
          },
        },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Magic Exhausted",
        type: "enchant",
        activityMatch: "Exhaust Staff",
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("-mgc", 20, "system.properties"),
          DDBEnricherData.ChangeHelper.overrideChange("", 20, "system.uses.max"),
          DDBEnricherData.ChangeHelper.overrideChange("Quarterstaff", 20, "name"),
          DDBEnricherData.ChangeHelper.overrideChange("Unexhaust Staff", 20, "activities[enchant].name"),
          DDBEnricherData.ChangeHelper.overrideChange("0", 20, "activities[cast].visibility.level.max"),
          DDBEnricherData.ChangeHelper.overrideChange("0", 20, "activities[utility].visibility.level.max"),
          DDBEnricherData.ChangeHelper.overrideChange("0", 20, "activities[summon].visibility.level.max"),
        ],
      },
    ];
  }

}
