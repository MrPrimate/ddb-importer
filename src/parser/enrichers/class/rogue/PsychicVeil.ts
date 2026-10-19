import DDBEnricherData from "../../data/DDBEnricherData";

export default class PsychicVeil extends DDBEnricherData {

  get useDefaultAdditionalActivities() {
    return true;
  }

  get addToDefaultAdditionalActivities() {
    return true;
  }

  get additionalActivities(): IDDBAdditionalActivity[] {
    if (this.isAction) return [];
    return [
      {
        init: {
          name: "Spend Psionic Energy Die to Restore Use",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          generateConsumption: true,
          generateTarget: true,
          generateActivation: true,
          generateUtility: true,
          activationOverride: {
            type: "none",
            value: null,
            condition: "",
          },
          consumptionOverride: {
            targets: [
              {
                type: "itemUses",
                target: "",
                value: -1,
                scaling: { mode: "", formula: "" },
              },
              {
                type: "itemUses",
                value: "1",
                target: "Psionic Power",
                scaling: { allowed: false, max: "" },
              },
            ],
          },
        },
      },
    ];
  }

  // built with the DDB "Psychic Veil" action the activity comes from; the feature pass would add a second copy
  get effects(): IDDBEffectHint[] {
    if (!this.isAction) return [];
    return [
      {
        name: "Psychic Veil",
        statuses: ["Invisible"],
        activityMatch: "Psychic Veil",
        options: {
          durationSeconds: 3600,
          description: "Invisible for 1 hour or until dismissed; ends early immediately after you deal damage to a creature or force a creature to make a saving throw.",
        },
      },
    ];
  }

  get override(): IDDBOverrideData {
    return {
      replaceActivityUses: true,
    };
  }
}
