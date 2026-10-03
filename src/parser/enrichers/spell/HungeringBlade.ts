import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Hungering Blade: the first hit each turn deals Necrotic damage equal to the spellcasting modifier
 * and grants that many Temporary Hit Points. Both are per-hit activities that spend no slot.
 */
export default class HungeringBlade extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Cast Spell",
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Necrotic Damage",
          type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE,
        },
        build: {
          generateDamage: true,
          generateConsumption: false,
          noSpellslot: true,
          noeffect: true,
          damageParts: [DDBEnricherData.basicDamagePart({ customFormula: "@mod", type: "necrotic", scalingMode: "none" })],
        },
      },
      {
        init: {
          name: "Temporary Hit Points",
          type: DDBEnricherData.ACTIVITY_TYPES.HEAL,
        },
        build: {
          generateDamage: false,
          generateHealing: true,
          generateConsumption: false,
          noSpellslot: true,
          noeffect: true,
          healingPart: DDBEnricherData.basicDamagePart({ customFormula: "@mod", type: "temphp", scalingMode: "none" }),
        },
        overrides: {
          targetType: "self",
        },
      },
    ];
  }

}
