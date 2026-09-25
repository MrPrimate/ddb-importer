import DDBEnricherData from "../../data/DDBEnricherData";

export default class FeyStep extends DDBEnricherData {

  /**
   * Summer's fire damage: the Mordenkainen's Tome of Foes eladrin deal their Charisma modifier
   * (minimum of 1), the Monsters of the Multiverse reprint deals the proficiency bonus instead.
   */
  get summerDamageFormula(): string {
    const description = this.ddbParser?.ddbDefinition?.description ?? this.ddbParser?.ddbDefinition?.snippet ?? "";
    return (/fire damage equal to your proficiency bonus/i).test(description)
      ? "@prof"
      : "max(1, @abilities.cha.mod)";
  }

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity(): IDDBActivityData {
    return {
      name: "Fey Step (Teleport)",
      targetType: "self",
      activationType: "bonus",
    };
  }

  get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Autumn (Save)",
          type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
        },
        build: {
          generateSave: true,
          generateActivation: true,
          generateConsumption: false,
          generateDamage: false,
          generateTarget: true,
        },
        overrides: {
          noConsumeTargets: true,
          targetType: "creature",
          activationType: "special",
        },
      },
      {
        init: {
          name: "Winter (Save)",
          type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
        },
        build: {
          generateSave: true,
          generateActivation: true,
          generateConsumption: false,
          generateDamage: false,
          generateTarget: true,
        },
        overrides: {
          noConsumeTargets: true,
          targetType: "creature",
          activationType: "special",
        },
      },
      {
        init: {
          name: "Summer (Damage)",
          type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE,
        },
        build: {
          generateActivation: true,
          generateConsumption: false,
          generateDamage: true,
          generateTarget: true,
        },
        overrides: {
          noConsumeTargets: true,
          rangeSelf: true,
          activationType: "special",
          data: {
            target: {
              affects: {
                type: "enemy",
              },
              template: {
                contiguous: false,
                type: "radius",
                size: "5",
                units: "ft",
              },
            },
            damage: {
              parts: [
                DDBEnricherData.basicDamagePart({
                  customFormula: this.summerDamageFormula,
                  type: "fire",
                }),
              ],
            },
          },
        },
      },
    ];
  }

  get clearAutoEffects() {
    return true;
  }

  get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Charmed",
        statuses: ["charmed"],
        options: {
          durationSeconds: 60,
        },
        activityMatch: "Autumn (Save)",
      },
      {
        name: "Frightened",
        statuses: ["frightened"],
        options: {
          durationSeconds: 6,
        },
        daeSpecialDurations: ["turnEndSource" as const],
        activityMatch: "Winter (Save)",
      },
    ];
  }

}
