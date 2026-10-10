import DDBEnricherData from "../data/DDBEnricherData";

/** The Hit Point Die sizes a character can hold. */
const HIT_DIE_SIZES = [6, 8, 10, 12];

interface IHitDieDamageOptions {
  /** activity name, suffixed with the die size */
  name: string;
  /** Hit Point Dice spent and rolled at the spell's base level */
  count: number;
  /** damage type */
  type: string;
  /** spend and roll one more die per slot level above the base */
  perLevel?: boolean;
  /** spend the dice (and the slot) when this activity is used */
  spend?: boolean;
}

/**
 * Activities for a blood magic spell paid in Hit Point Dice ("you must expend one Hit Point Die or
 * the spell automatically fails ... roll the Hit Point Dice expended"): one per die size, rolling
 * that many dice of the size. With `spend` the activity also spends those dice with the spell slot;
 * without it the activity is a later roll of dice spent when the spell was cast.
 */
export function hitDieDamageActivities({
  name, count, type, perLevel = false, spend = true,
}: IHitDieDamageOptions): IDDBAdditionalActivity[] {
  return HIT_DIE_SIZES.map((die) => ({
    init: {
      name: `${name} (d${die})`,
      type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE,
    },
    build: {
      generateDamage: true,
      generateConsumption: spend,
      noSpellslot: !spend,
      noeffect: true,
      damageParts: [
        DDBEnricherData.basicDamagePart({
          number: count,
          denomination: die,
          type,
          scalingMode: perLevel ? "whole" : "none",
          scalingNumber: perLevel ? 1 : null,
        }),
      ],
      consumptionOverride: spend
        ? {
          spellSlot: true,
          scaling: {
            allowed: false,
            max: "",
          },
          targets: [
            {
              type: "hitDice",
              target: `d${die}`,
              value: `${count}`,
              scaling: {
                mode: perLevel ? "amount" : "",
                formula: perLevel ? "1" : "",
              },
            },
          ],
        }
        : null,
    },
  }));
}

/** Activities spending Hit Point Dice of each size with the spell slot, for spells that roll them later. */
export function hitDieCastActivities({ count, perLevel = false }: { count: number; perLevel?: boolean }): IDDBAdditionalActivity[] {
  return HIT_DIE_SIZES.map((die) => ({
    init: {
      name: `Cast Spell (d${die})`,
      type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
    },
    build: {
      generateConsumption: true,
      consumptionOverride: {
        spellSlot: true,
        scaling: {
          allowed: false,
          max: "",
        },
        targets: [
          {
            type: "hitDice",
            target: `d${die}`,
            value: `${count}`,
            scaling: {
              mode: perLevel ? "amount" : "",
              formula: perLevel ? "1" : "",
            },
          },
        ],
      },
    },
  }));
}
