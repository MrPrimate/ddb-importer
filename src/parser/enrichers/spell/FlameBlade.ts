import DDBEnricherData from "../data/DDBEnricherData";

export default class FlameBlade extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity() {
    return {
      name: "Summon Blade",
    };
  }

  get effects() {
    return [
      {
        name: "Flame Blade",
        activityMatch: "Summon Blade",
        atlChanges: [
          DDBEnricherData.ChangeHelper.upgradeChange("20", 20, "ATL.light.dim"),
          DDBEnricherData.ChangeHelper.upgradeChange("10", 20, "ATL.light.bright"),
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

  get additionalActivities() {
    return [
      {
        init: {
          name: "Attack",
          type: "attack",
        },
        build: {
          generateAttack: true,
          generateDamage: true,
          geneateActivation: true,
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
