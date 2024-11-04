/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../../DDBEnricherMixin.js";

export default class StarryForm extends DDBEnricherMixin {

  get type() {
    return "utility";
  }

  get activity() {
    return {
      noTemplate: true,
      targetType: "self",
      activationType: "bonus",
      name: "Activate Starry Form",
    };
  }

  get additionalActivities() {
    return [
      {
        constructor: {
          name: "Archer Attack",
          type: "attack",
        },
        build: {
          generateAttack: true,
          generateConsumption: false,
          generateTarget: true,
          generateDamage: true,
          attackOverride: {
            ability: "spellcasting",
            type: {
              classification: "spell",
              value: "range",
            },
          },
          damageParts: [DDBEnricherMixin.basicDamagePart({ customFormula: "@scale.stars.starry-form + @mod", type: "radiant" })],
          targetOverride: {
            affects: {
              count: "1",
              type: "creature",
            },
          },
          rangeOverride: {
            value: "60",
            units: "ft",
          },
          activationOverride: {
            type: "bonus",
            value: 1,
            condition: "",
          },
        },
      },
      {
        constructor: {
          name: "Chalice Healing",
          type: "heal",
        },
        build: {
          generateAttack: false,
          generateConsumption: false,
          generateTarget: true,
          generateDamage: false,
          generateHealing: true,
          healingPart: DDBEnricherMixin.basicDamagePart({ customFormula: "@scale.stars.starry-form + @mod", type: "healing" }),
          targetOverride: {
            affects: {
              count: "1",
              type: "creature",
            },
          },
          rangeOverride: {
            value: "30",
            units: "ft",
          },
          activationOverride: {
            type: "bonus",
            value: 1,
            condition: "",
          },
        },
      },
      {
        constructor: {
          name: "Dragon Constitution",
          type: "utility",
        },
        build: {
          generateAttack: false,
          generateConsumption: false,
          generateTarget: true,
          generateDamage: false,
          generateHealing: false,
          targetOverride: {
            affects: {
              count: "1",
              type: "self",
            },
          },
          rangeOverride: {
            units: "self",
          },
          activationOverride: {
            type: "bonus",
            value: 1,
            condition: "",
          },
        },
      },
    ];
  }

  get effects() {
    return [
      {
        activityMatch: "Activate Starry Form",
        atlChanges: [
          DDBEnricherMixin.generateATLChange("ATL.light.dim", CONST.ACTIVE_EFFECT_MODES.UPGRADE, '20'),
          DDBEnricherMixin.generateATLChange("ATL.light.bright", CONST.ACTIVE_EFFECT_MODES.UPGRADE, '10'),
          DDBEnricherMixin.generateATLChange("ATL.light.color", CONST.ACTIVE_EFFECT_MODES.OVERRIDE, '#f3f5e5'),
          DDBEnricherMixin.generateATLChange("ATL.light.alpha", CONST.ACTIVE_EFFECT_MODES.OVERRIDE, '0.35'),
          DDBEnricherMixin.generateATLChange("ATL.light.animation", CONST.ACTIVE_EFFECT_MODES.OVERRIDE, '{"type": ""starlight"", "speed": 5,"intensity": 5}'),
        ],
      },
      {
        activityMatch: "Dragon Constitution",
        changes: [],
      },
      {
        activityMatch: "Dragon Constitution",
        data: {
          name: "Dragon Form: Twinkling Constellations",
        },
        changes: [
          DDBEnricherMixin.generateUpgradeChange("20", 20, "system.attributes.movement.fly"),
        ],
      },
    ];
  }

  get override() {
    return {
      data: {
        "flags.ddbimporter.ignoredConsumptionActivities": [
          "Archer Attack",
          "Chalice Healing",
          "Dragon Constitution",
        ],
      },
    };
  }

}
