import DDBEnricherData from "../data/DDBEnricherData";

export default class Sanctuary extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      data: {
        name: "Cast",
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Save vs Target",
          type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
        },
        build: {
          noSpellslot: true,
          generateDamage: false,
          generateSave: true,
          durationOverride: {
            units: "inst",
            concentration: false,
          },
        },
        overrides: {
          targetType: "creature",
        },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Sanctuary",
        activityMatch: "Cast",
        options: {
          durationSeconds: 60,
        },
      },
    ];
  }

}
