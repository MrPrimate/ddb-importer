import DDBEnricherData from "../data/DDBEnricherData";

export default class SylunsViper extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Cast",
      targetSelf: true,
      data: {
        sort: 1,
        healing: DDBEnricherData.basicDamagePart({
          bonus: "15",
          type: "temphp",
          scalingMode: "whole",
          scalingFormula: "5",
        }),
      },
    };
  }

  override get clearAutoEffects(): boolean {
    return true;
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Spectral Snake",
        activityMatch: "Cast",
        options: {
          durationSeconds: 3600,
        },
        changes: [
          DDBEnricherData.ChangeHelper.upgradeChange("@attributes.movement.speeds.walk", 20, "system.attributes.movement.speeds.climb"),
        ],
      },
      {
        name: "Viper Poison",
        activityMatch: "Spectral Snake Attack",
        options: {
          expiry: "sourceStart",
        },
        statuses: ["Poisoned", "Incapacitated"],
      },
    ];
  }

  override get addAutoAdditionalActivities(): boolean {
    return false;
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Spectral Snake Attack",
          type: DDBEnricherData.ACTIVITY_TYPES.ATTACK,
        },
        build: {
          generateAttack: true,
          generateDamage: true,
        },
        overrides: {
          activationType: "action",
          removeSpellSlotConsume: true,
          noConsumeTargets: true,
          noTemplate: true,
          targetType: "creature",
          data: {
            sort: 2,
            range: {
              override: true,
              value: 50,
              units: "ft",
            },
            damage: {
              parts: [
                DDBEnricherData.basicDamagePart({
                  number: 1,
                  denomination: 6,
                  type: "force",
                  scalingMode: "whole",
                }),
              ],
            },
          },
        },
      },
    ];
  }
}
