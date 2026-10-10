import DDBEnricherData from "../data/DDBEnricherData";
import { endSpellChanges, riders, selfEnchantCast } from "./_SelfEnchantSpell";

/**
 * Hungering Blade: the first hit each turn deals Necrotic damage equal to the spellcasting modifier
 * and grants that many Temporary Hit Points. Both are per-hit activities that spend no slot, and
 * activity riders of the self-enchanting cast (see _SelfEnchantSpell), so they only appear while
 * the spell lasts.
 */
export default class HungeringBlade extends DDBEnricherData {

  static CAST_ID = "ddbHungerBladeCa";

  static DAMAGE_ID = "ddbHungerBladeDm";

  static TEMP_HP_ID = "ddbHungerBladeHp";

  static PROFILE_ID = "ddbHungerBladeEn";

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.ENCHANT;
  }

  override get activity(): IDDBActivityData {
    return selfEnchantCast({ name: "Cast Spell", id: HungeringBlade.CAST_ID });
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Hungering Blade",
        type: "enchant",
        activityMatch: "Cast Spell",
        changes: endSpellChanges(HungeringBlade.CAST_ID, "End Hungering Blade"),
        data: {
          _id: HungeringBlade.PROFILE_ID,
          flags: {
            ddbimporter: riders({ activities: [HungeringBlade.DAMAGE_ID, HungeringBlade.TEMP_HP_ID] }),
          },
        },
      },
    ];
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
        overrides: {
          id: HungeringBlade.DAMAGE_ID,
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
          id: HungeringBlade.TEMP_HP_ID,
          targetType: "self",
        },
      },
    ];
  }

}
