import DDBEnricherData from "../data/DDBEnricherData";

export default class VengefulBlade extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.NONE;
  }

  get additionalActivities() {
    return [
      {
        init: {
          name: "Extra Attack Damage",
          type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE,
        },
        build: {
          generateDamage: true,
          generateConsumption: false,
          noSpellslot: true,
          generateAttack: false,
          onsave: false,
          damageParts: [DDBEnricherData.basicDamagePart({
            type: "necrotic",
            scalingMode: "whole",
            scalingFormula: "1d8",
          })],
          noeffect: true,
          overrideRange: {
            value: "5",
            units: "ft",
          },
          overrideTarget: {
            affects: { type: "creature", count: "1" },
            template: {},
          },
          activationOverride: { type: "", condition: "Creature moves more than 5 ft" },
        },
        overrides: {
          overrideTemplate: true,
          noTemplate: true,
          allowCritical: true,
          data: {
            range: {
              override: true,
              value: 5,
              units: "ft",
            },
          },
        },
      },
      {
        init: {
          name: "Extra Damage",
          type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE,
        },
        build: {
          generateDamage: true,
          generateConsumption: false,
          noSpellslot: true,
          generateAttack: false,
          onsave: false,
          damageParts: [DDBEnricherData.basicDamagePart({ number: 1, denomination: 8, type: "necrotic" })],
          noeffect: true,
          overrideRange: {
            value: "5",
            units: "ft",
          },
          overrideTarget: {
            affects: { type: "creature", count: "1" },
            template: {},
          },
          activationOverride: { type: "", condition: "Target makes an attack or spell" },
        },
        overrides: {
          overrideTemplate: true,
          noTemplate: true,
          data: {
            id: "ddb-boom-atta-dam",
          },
        },
      },
    ];
  }

  get effects() {
    return [{
      name: "Vengeful Blade: RadiatesDark Aura of Energy",
      options: {
        description: `If the target makes an attack or spell before then, [[/item ${this.data.name} activity="Extra Damage"]](it takes necrotic damage), and the spell ends.`,
      },
      daeSpecialDurations: ["1Attack" as const, "1Spell" as const, "turnEndSource" as const],
    }];
  }

}
