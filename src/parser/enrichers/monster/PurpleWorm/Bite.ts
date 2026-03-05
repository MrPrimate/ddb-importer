import DDBEnricherData from "../../data/DDBEnricherData";

export default class Bite extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.ATTACK;
  }

  get activity(): IDDBActivityData {
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
      data: this.is2014
        ? {
          damage: {
            parts: [this.ddbParser.actionData.damageParts[0]],
          },
        }
        : {

        },
    };
  }

  get additionalActivities2014() {
    return [
      {
        init: {
          name: "Swallowed Damage",
          type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE,
        },
        build: {
          generateDamage: true,
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

  get additionalActivities(): IDDBAdditionalActivity[] {
    if (this.is2014) return this.additionalActivities2014;
    return [];
  }

  get effects(): IDDBEffectHint[] {
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
