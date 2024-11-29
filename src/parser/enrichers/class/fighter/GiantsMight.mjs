/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class GiantsMight extends DDBEnricherData {

  get type() {
    return "utility";
  }

  get activity() {
    return {
      targetType: "self",
      data: {
        duration: {
          value: "1",
          units: "minute",
        },
      },
    };
  }

  get additionalActivities() {
    return [
      {
        constructor: {
          name: "Bonus Damage",
          type: "damage",
        },
        build: {
          noeffect: true,
          generateConsumption: false,
          generateTarget: false,
          generateRange: false,
          generateActivation: true,
          generateDamage: true,
          activationOverride: {
            type: "special",
            value: 1,
            condition: "",
          },
          damageParts: [DDBEnricherData.basicDamagePart({ number: 1, denomination: 6 })],
        },
      },
    ];
  }

  get effects() {
    return [
      {
        options: {
          durationSeconds: 60,
          description: "You also gain advantage on Strength checks and saving throws.",
        },
        atlChanges: [
          DDBEnricherData.ChangeHelper.atlChange("ATL.width", CONST.ACTIVE_EFFECT_MODES.UPGRADE, 2, 5),
          DDBEnricherData.ChangeHelper.atlChange("ATL.height", CONST.ACTIVE_EFFECT_MODES.UPGRADE, 2, 5),
        ],
        changes: [
          DDBEnricherData.ChangeHelper.overrideChange("lg", 25, "system.traits.size"),
        ],
      },
    ];
  }
}


