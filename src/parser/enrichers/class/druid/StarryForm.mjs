/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class StarryForm extends DDBEnricherData {
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
              value: "ranged",
            },
          },
          damageParts: [
            DDBEnricherData.basicDamagePart({
              customFormula: "@scale.stars.starry-form + @mod",
              type: "radiant",
            }),
          ],
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
          healingPart: DDBEnricherData.basicDamagePart({
            customFormula: "@scale.stars.starry-form + @mod",
            type: "healing",
          }),
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
    const atlChanges = [
      DDBEnricherData.ChangeHelper.atlChange("ATL.light.dim", CONST.ACTIVE_EFFECT_MODES.UPGRADE, "20"),
      DDBEnricherData.ChangeHelper.atlChange("ATL.light.bright", CONST.ACTIVE_EFFECT_MODES.UPGRADE, "10"),
      DDBEnricherData.ChangeHelper.atlChange("ATL.light.color", CONST.ACTIVE_EFFECT_MODES.OVERRIDE, "#f3f5e5"),
      DDBEnricherData.ChangeHelper.atlChange("ATL.light.alpha", CONST.ACTIVE_EFFECT_MODES.OVERRIDE, "0.35"),
      DDBEnricherData.ChangeHelper.atlChange(
        "ATL.light.animation",
        CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
        '{"type": ""starlight"", "speed": 5,"intensity": 5}',
      ),
    ];
    return [
      {
        activityMatch: "Activate Starry Form",
        name: "Starry Form: Archer",
        atlChanges,
      },
      {
        activityMatch: "Activate Starry Form",
        name: "Starry Form: Chalice",
        atlChanges,
      },
      {
        activityMatch: "Activate Starry Form",
        name: "Starry Form: Dragon",
        changes: [
          DDBEnricherData.ChangeHelper.upgradeChange("10", 10, "system.attributes.concentration.roll.min"),
        ],
        atlChanges,
      },
      {
        activityMatch: "Activate Starry Form",
        name: "Twinkling Constellations (Level 10)",
        changes: [
          DDBEnricherData.ChangeHelper.upgradeChange("20", 20, "system.attributes.movement.fly"),
        ],
      },
      {
        activityMatch: "Activate Starry Form",
        name: "Full of Stars (Level 14)",
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("bludgeoning", 20, "system.traits.dr.value"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("piercing", 20, "system.traits.dr.value"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("slashing", 20, "system.traits.dr.value"),
        ],
      },
    ];
  }

  get override() {
    return {
      data: {
        "flags.ddbimporter.ignoredConsumptionActivities": ["Archer Attack", "Chalice Healing", "Dragon Constitution"],
      },
    };
  }
}
