import DDBEnricherData from "../../data/DDBEnricherData";

export default class Bite extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.ATTACK;
  }

  override get activity(): IDDBActivityData {
    return {
      name: this.is2014
        ? "Bite"
        : this.ddbEnricher?._originalActivity?.type === "check"
          ? "Escape Check"
          : "Bite",
      activationType: this.is2014
        ? "action"
        : this.ddbEnricher?._originalActivity?.type === "check"
          ? "special"
          : "action",
      // the bite's own damage is the weapon's base roll
      data: this.is2014
        ? {
          damage: {
            parts: [],
          },
        }
        : {

        },
    };
  }

  get additionalActivities2014(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Swallowed Damage",
          type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE,
        },
        build: {
          generateDamage: true,
          // "takes 21 (6d6) acid damage at the start of each of the worm's turns"
          damageParts: "ddbMonsterDamage" in this.ddbParser
            ? this.ddbParser.ddbMonsterDamage.recurringParts.map((part) => part.part)
            : [],
        },
        overrides: {
          activationType: "special",
        },
      },
      {
        init: {
          name: "Escape Check",
          type: DDBEnricherData.ACTIVITY_TYPES.CHECK,
        },
        build: {
          generateCheck: true,
        },
        overrides: {
          activationType: "special",
        },
      },
    ];
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    if (this.is2014) return this.additionalActivities2014;
    return [];
  }

  override get effects(): IDDBEffectHint[] {
    return this.is2014
      ? [
        {
          name: "Purple Worm: Swallowed",
          activityMatch: "Bite",
          statuses: ["Blinded", "Restrained"],
        },
      ]
      : [];
  }

}
