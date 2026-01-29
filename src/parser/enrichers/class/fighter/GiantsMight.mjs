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
          damageParts: [DDBEnricherData.basicDamagePart({ number: 1, denomination: 6, types: DDBEnricherData.allDamageTypes() })],
        },
      },
    ];
  }

  get effects() {
    return [
      {
        options: {
          durationSeconds: 60,
        },
        atlChanges: [
          DDBEnricherData.ChangeHelper.atlChange("ATL.width", CONST.ACTIVE_EFFECT_MODES.UPGRADE, 2, 5),
          DDBEnricherData.ChangeHelper.atlChange("ATL.height", CONST.ACTIVE_EFFECT_MODES.UPGRADE, 2, 5),
        ],
        changes: [
          DDBEnricherData.ChangeHelper.overrideChange("lg", 25, "system.traits.size"),
          DDBEnricherData.ChangeHelper.unsignedAddChange(`${CONFIG.Dice.D20Roll.ADV_MODE.ADVANTAGE}`, 20, "system.abilities.str.save.roll.mode"),
          DDBEnricherData.ChangeHelper.unsignedAddChange(`${CONFIG.Dice.D20Roll.ADV_MODE.ADVANTAGE}`, 20, "system.abilities.str.check.roll.mode"),
        ],
        midiOptionalChanges: [
          {
            name: "giantsMight",
            data: {
              label: "Giant's Might Bonus Damage",
              count: "turn",
              "damage.all": "1d6",
              criticalDamage: "1",
            },
          },
        ],
      },
    ];
  }
}


