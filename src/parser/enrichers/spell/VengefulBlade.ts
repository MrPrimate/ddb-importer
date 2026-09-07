import DDBEnricherData from "../data/DDBEnricherData";

export default class VengefulBlade extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.NONE;
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
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
          rangeOverride: {
            value: "5",
            units: "ft",
          },
          targetOverride: {
            affects: { type: "creature", count: "1" },
            template: {},
          },
          activationOverride: { type: "special", condition: "Creature moves more than 5 ft" },
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
          name: "Target attacks or casts damage",
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
          rangeOverride: {
            value: "5",
            units: "ft",
          },
          targetOverride: {
            affects: { type: "creature", count: "1" },
            template: {},
          },
          activationOverride: { type: "special", condition: "Target makes an attack or spell" },
        },
        overrides: {
          overrideTemplate: true,
          noTemplate: true,
          data: {
            _id: "ddbVengefulBlDa1",
          },
        },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [{
      activityMatch: "Extra Attack Damage",
      name: "Vengeful Blade: Radiates Dark Aura of Energy",
      options: {
        // "radiates a dark aura of energy until the start of your next turn"
        expiry: "sourceStart",
        description: `If the target makes an attack or spell before then, [[/item ${this.data.name} activity="Extra Damage"]](it takes necrotic damage), and the spell ends.`,
      },
      daeSpecialDurations: ["1Attack", "1Spell"],
    }];
  }

}
