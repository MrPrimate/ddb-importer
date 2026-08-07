import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Dark Gift. A free Alter Self with no components or concentration, plus the
 * involuntary transformation save once the uses run out.
 */
export default class SecondSkin extends DDBEnricherData {

  get stopDefaultActivity() {
    return true;
  }

  get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Alternate Form",
          type: DDBEnricherData.ACTIVITY_TYPES.CAST,
        },
        build: {
          generateConsumption: false,
          generateSpell: true,
        },
        overrides: {
          addItemConsume: true,
          addSpellUuid: "Alter Self",
          data: {
            duration: {
              concentration: false,
              override: true,
            },
            spell: {
              properties: [],
              spellbook: false,
            },
          },
        },
      },
      {
        init: {
          name: "Involuntary Change",
          type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
        },
        build: {
          generateSave: true,
          generateTarget: true,
          generateActivation: true,
          generateEffects: true,
          saveOverride: {
            ability: ["cha"],
            dc: {
              calculation: "",
              formula: "13 + @prof",
            },
          },
          activationOverride: {
            type: "special",
            value: null,
            condition: "No uses remain",
          },
        },
        overrides: {
          noConsumeTargets: true,
          targetType: "self",
        },
      },
    ];
  }

  get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Unable to Change",
        activityMatch: "Involuntary Change",
        options: {
          durationSeconds: 6,
          durationRounds: 1,
        },
        riderStatuses: ["stunned"],
      },
    ];
  }

}
