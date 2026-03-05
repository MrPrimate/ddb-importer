import DDBEnricherData from "../data/DDBEnricherData";

export default class Sanctuary extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity(): IDDBActivityData {
    return {
      data: {
        name: "Cast",
      },
    };
  }

  get additionalActivities(): IDDBAdditionalActivity[] {
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

  get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Sanctuary",
        matchActivity: "Cast",
        options: {
          durationSeconds: 60,
        },
      },
    ];
  }

}
