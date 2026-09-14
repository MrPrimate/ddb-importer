import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Otiluke's Freezing Sphere: the globe can freeze a body of water, trapping swimmers in the ice for a minute.
 */
export default class OtilukesFreezingSphere extends DDBEnricherData {

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Freeze Water",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          generateActivation: true,
          generateTarget: true,
          generateRange: true,
          generateConsumption: false,
          noSpellslot: true,
          noeffect: true,
          generateUtility: true,
          activationOverride: {
            type: "special",
            value: null,
            condition: "If the globe strikes a body of water, it freezes a 30-foot square to a depth of 6 inches",
          },
          targetOverride: {
            template: { type: "square", size: "30", units: "ft", count: "" },
            affects: { count: "", type: "creature", choice: false, special: "" },
          },
        },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Trapped in Ice",
        activityMatch: "Freeze Water",
        statuses: ["Restrained"],
        options: {
          durationSeconds: 60,
          description: "Creatures swimming on the surface are trapped in the ice; escaping takes an action and a Strength (Athletics) check against the spell save DC.",
        },
      },
    ];
  }

}
