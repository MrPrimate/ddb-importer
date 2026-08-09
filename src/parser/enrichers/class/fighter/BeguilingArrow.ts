import ArcaneShotOption from "./ArcaneShotOption";

export default class BeguilingArrow extends ArcaneShotOption {

  override get type(): IDDBActivityType | null {
    return this.isAction ? ArcaneShotOption.ACTIVITY_TYPES.DAMAGE : ArcaneShotOption.ACTIVITY_TYPES.NONE;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Extra Damage",
      noTemplate: true,
      data: {
        range: {
          value: null,
          units: "spec",
        },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return this.isAction
      ? [
        {
          init: {
            name: "Save vs Charmed",
            type: ArcaneShotOption.ACTIVITY_TYPES.SAVE,
          },
          build: {
            generateSave: true,
            generateDamage: false,
            generateRange: true,
            noSpellslot: true,
          },
          overrides: {
            noConsumeTargets: true,
            activationType: "special",
            noTemplate: true,
            data: {
              range: {
                value: null,
                units: "spec",
              },
            },
          },
        },
      ]
      : [];
  }

  override get effects(): IDDBEffectHint[] {
    if (!this.isAction) return [];
    return [
      {
        name: "Charmed",
        activityMatch: "Save vs Charmed",
        statuses: ["Charmed"],
        options: {
          durationSeconds: 12,
        },
        daeSpecialDurations: ["turnEnd" as const],
      },
    ];
  }

  override get addToDefaultAdditionalActivities(): boolean {
    return true;
  }

  override get override(): IDDBOverrideData {
    return {
      ignoredConsumptionActivities: ["Save vs Charmed"],
    };
  }

}
