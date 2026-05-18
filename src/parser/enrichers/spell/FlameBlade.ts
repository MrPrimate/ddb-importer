import DDBEnricherData from "../data/DDBEnricherData";

export default class FlameBlade extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity(): IDDBActivityData {
    return {
      name: "Summon Blade",
    };
  }

  get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Flame Blade",
        activityMatch: "Summon Blade",
        changes: [
          DDBEnricherData.ChangeHelper.upgradeChange("20", 20, "token.light.dim"),
          DDBEnricherData.ChangeHelper.upgradeChange("10", 20, "token.light.bright"),
          DDBEnricherData.ChangeHelper.overrideChange("#a78942", 20, "token.light.color"),
          DDBEnricherData.ChangeHelper.overrideChange("0.25", 20, "token.light.alpha"),
          DDBEnricherData.ChangeHelper.overrideChange("4", 20, "token.light.animation.intensity"),
          DDBEnricherData.ChangeHelper.overrideChange("torch", 20, "token.light.animation.type"),
          DDBEnricherData.ChangeHelper.overrideChange("2", 20, "token.light.animation.speed"),
        ],
        data: {
          flags: {
            dae: {
              selfTarget: true,
              selfTargetAlways: true,
            },
          },
        },
      },
    ];
  }

  get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Attack",
          type: DDBEnricherData.ACTIVITY_TYPES.ATTACK,
        },
        build: {
          generateAttack: true,
          generateDamage: true,
          generateActivation: true,
          noSpellslot: true,
          generateRange: true,
          generateTarget: true,
        },
        overrides: {
          activationType: "action",
          targetType: "creature",
          data: {
            range: {
              value: 5,
              units: "ft",
            },
            damage: {
              parts: [
                DDBEnricherData.basicDamagePart({
                  number: 3,
                  denomination: 6,
                  bonus: this.is2014 ? "" : "@mod",
                  scalingMode: "whole",
                  scalingNumber: 1,
                }),
              ],
            },
          },
        },
      },
    ];
  }

}
