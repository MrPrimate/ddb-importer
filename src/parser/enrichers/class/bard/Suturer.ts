import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * College of Fleshweaving. Three uses of a Bardic Inspiration die: temporary
 * hit points, a thread that restrains, and a paralysing needle strike.
 */
export default class Suturer extends DDBEnricherData {

  static INSPIRATION = "Bardic Inspiration";

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  get activity(): IDDBActivityData {
    return {
      name: "Suture",
      activationType: "special",
      addItemConsume: true,
      itemConsumeTargetName: Suturer.INSPIRATION,
      data: {
        healing: DDBEnricherData.basicDamagePart({
          customFormula: "@scale.bard.inspiration",
          types: ["temphp"],
        }),
      },
    };
  }

  get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Unspool",
          type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
        },
        build: {
          generateSave: true,
          generateTarget: true,
          generateRange: true,
          generateActivation: true,
          generateEffects: true,
          saveOverride: {
            ability: ["str"],
            dc: {
              calculation: "spellcasting",
              formula: "",
            },
          },
          activationOverride: {
            type: "action",
            value: 1,
            condition: "",
          },
        },
        overrides: {
          addItemConsume: true,
          itemConsumeTargetName: Suturer.INSPIRATION,
          data: {
            damage: { onSave: "none" },
            visibility: { level: { min: 5, max: null } },
          },
        },
      },
      {
        init: {
          name: "Acupuncture",
          type: DDBEnricherData.ACTIVITY_TYPES.ATTACK,
        },
        build: {
          generateAttack: true,
          generateDamage: true,
          generateTarget: true,
          generateRange: true,
          generateActivation: true,
          attackOverride: {
            ability: "spellcasting",
            type: {
              value: "melee",
              classification: "spell",
            },
          },
          activationOverride: {
            type: "action",
            value: 1,
            condition: "",
          },
          damageParts: [
            DDBEnricherData.basicDamagePart({
              customFormula: "@scale.bard.inspiration.die",
              types: ["piercing"],
            }),
          ],
        },
        overrides: {
          addItemConsume: true,
          itemConsumeTargetName: Suturer.INSPIRATION,
          data: {
            visibility: { level: { min: 10, max: null } },
          },
        },
      },
      {
        init: {
          name: "Save vs Paralysis",
          type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
        },
        build: {
          generateSave: true,
          generateTarget: true,
          generateRange: true,
          generateActivation: true,
          generateEffects: true,
          saveOverride: {
            ability: ["con"],
            dc: {
              calculation: "spellcasting",
              formula: "",
            },
          },
          activationOverride: {
            type: "special",
            value: null,
            condition: "Hit by Acupuncture",
          },
        },
        overrides: {
          noConsumeTargets: true,
          data: {
            visibility: { level: { min: 10, max: null } },
          },
        },
      },
    ];
  }

  get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Restrained by Thread",
        activityMatch: "Unspool",
        options: {
          durationSeconds: 60,
        },
        daeSpecialDurations: ["turnStart"],
        statuses: ["Restrained"],
      },
      {
        name: "Acupuncture Paralysis",
        activityMatch: "Save vs Paralysis",
        options: {
          durationSeconds: 6,
          durationRounds: 1,
        },
        daeSpecialDurations: ["turnEnd"],
        statuses: ["Paralyzed"],
      },
    ];
  }

}
