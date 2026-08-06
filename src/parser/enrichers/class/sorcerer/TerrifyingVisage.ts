import DDBEnricherData from "../../data/DDBEnricherData";

export default class TerrifyingVisage extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity(): IDDBActivityData {
    return {
      name: "Adopt Visage",
      targetType: "self",
      activationType: "bonus",
      addItemConsume: true,
      data: {
        duration: {
          value: "10",
          units: "minute",
        },
      },
    };
  }

  get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Frighten",
          type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
        },
        build: {
          generateSave: true,
          generateTarget: true,
          generateRange: true,
          noSpellslot: true,
        },
        overrides: {
          targetType: "creature",
          activationType: "action",
          noConsumeTargets: true,
          data: {
            save: {
              ability: ["wis"],
              dc: {
                calculation: "spellcasting",
                formula: "",
              },
            },
            range: {
              units: "self",
            },
            target: {
              template: {
                type: "radius",
                size: "30",
                units: "ft",
                count: "",
                contiguous: false,
                width: "",
                height: "",
              },
            },
          },
        },
      },
    ];
  }

  get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Terrifying Visage",
        activityMatch: "Adopt Visage",
        options: {
          durationSeconds: 600,
          description: "While active you gain a benefit based on your Blood Ties choice: Fey - teleport 30 feet as a Bonus Action; Fiend - Resistance to Cold and Fire damage; Undead - use a Reaction to reduce non-Radiant damage taken by half your Sorcerer level.",
        },
      },
      {
        name: "Frightened",
        activityMatch: "Frighten",
        statuses: ["Frightened"],
        options: {
          durationSeconds: 12,
        },
        daeSpecialDurations: ["turnEndSource" as const],
      },
    ];
  }

}
