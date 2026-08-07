import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Two activities: one to create the bubble, and one for the charm save made by
 * a creature that looks at it.
 */
export default class PolychromaticBubble extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity(): IDDBActivityData {
    return {
      name: "Create Bubble",
    };
  }

  get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Save",
          type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
        },
        build: {
          generateSave: true,
          generateTarget: true,
          generateRange: true,
          generateActivation: true,
          generateEffects: true,
          noSpellslot: true,
          saveOverride: {
            ability: ["wis"],
            dc: {
              calculation: "spellcasting",
              formula: "",
            },
          },
          activationOverride: {
            type: "special",
            value: null,
            condition: "A creature looks at the bubble",
          },
        },
        overrides: {
          noSpellslot: true,
        },
      },
    ];
  }

  get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Polychromatic Bubble",
        activityMatch: "Create Bubble",
        options: {
          durationSeconds: 60,
          durationRounds: 10,
        },
      },
      {
        name: "Polychromatic Bubble: Charmed",
        activityMatch: "Save",
        options: {
          durationSeconds: 12,
          durationRounds: 2,
        },
        daeSpecialDurations: ["turnStart"],
        statuses: ["Charmed"],
      },
    ];
  }

}
