import DDBEnricherData from "../data/DDBEnricherData";

export default class FlameBlade extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Summon Blade",
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Flame Blade",
        activityMatch: "Summon Blade",
        atlChanges: [
          DDBEnricherData.ChangeHelper.upgradeChange("20", 20, "ATL.light.dim"),
          DDBEnricherData.ChangeHelper.upgradeChange("10", 20, "ATL.light.bright"),
          DDBEnricherData.ChangeHelper.atlChange("ATL.light.color", CONST.ACTIVE_EFFECT_MODES.OVERRIDE, "#a78942"),
          DDBEnricherData.ChangeHelper.atlChange("ATL.light.alpha", CONST.ACTIVE_EFFECT_MODES.OVERRIDE, "0.25"),
          DDBEnricherData.ChangeHelper.atlChange("ATL.light.animation", CONST.ACTIVE_EFFECT_MODES.OVERRIDE, "{\"type\": \"torch\", \"speed\": 2,\"intensity\": 4}"),
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

  override get additionalActivities(): IDDBAdditionalActivity[] {
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
