import DDBEnricherData from "../data/DDBEnricherData";
import { endSpellChanges, riders, selfEnchantCast, slotLevels } from "./_SelfEnchantSpell";

/**
 * Casting is a self-enchantment on the spell (see _SelfEnchantSpell), and Breathe is its activity
 * rider, so the breath only appears on the sheet while the spell lasts.
 *
 * Breathe is used on later turns without a slot, and dnd5e offers no scaling for a slot-free
 * spell activity, so it would always roll the base 3d6. Each slot level instead has its own
 * profile, picked by the cast level, that sets Breathe's dice for that level.
 *
 * The enchantment lands on the caster's spell even when the spell is cast on someone else, so
 * the caster rolls the breath for the touched creature.
 */
export default class DragonsBreath extends DDBEnricherData {

  static CAST_NAME = "Cast";

  static CAST_ID = "ddbDragonBreathC";

  static BREATHE_ID = "ddbDragonBreathe";

  static RIDER_EFFECT_ID = "ddbDragonBreathR";

  static BASE_LEVEL = 2;

  static DAMAGE_TYPES = ["acid", "cold", "fire", "lightning", "poison"];

  static profileId(level: number): string {
    return `ddbDragonBreath${level}`;
  }

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.ENCHANT;
  }

  override get activity(): IDDBActivityData {
    return selfEnchantCast({ name: DragonsBreath.CAST_NAME, id: DragonsBreath.CAST_ID });
  }

  /** Breathe's damage when the spell was cast with a slot of the given level. */
  static damagePart(level: number): I5eDamagePart {
    return DDBEnricherData.basicDamagePart({
      number: 3 + level - DragonsBreath.BASE_LEVEL,
      denomination: 6,
      types: DragonsBreath.DAMAGE_TYPES,
    });
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Breathe",
          type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
        },
        build: {
          // the copy dnd5e makes of a rider activity is not a rider, so it would inherit the
          // spell's concentration and using it would end the spell
          generateDuration: true,
          durationOverride: { units: "inst", concentration: false },
          generateSave: true,
          generateDamage: true,
          generateTarget: true,
          generateRange: true,
          rangeOverride: { units: "self" },
          targetOverride: {
            override: true,
            affects: { type: "creature" },
            template: { type: "cone", size: "15", units: "ft" },
          },
        },
        overrides: {
          id: DragonsBreath.BREATHE_ID,
          noSpellslot: true,
          activationType: "action",
          overrideActivation: true,
          activationCondition: "While Dragon's Breath lasts",
          data: {
            damage: {
              onSave: "half",
              parts: [DragonsBreath.damagePart(DragonsBreath.BASE_LEVEL)],
            },
          },
        },
      },
    ];
  }

  /** The caster's reminder of the spell, carried onto the actor while the spell is active. */
  get riderEffect(): IDDBEffectHint {
    return {
      name: "Dragon's Breath",
      options: {
        transfer: true,
        durationSeconds: 60,
        description: `Until the spell ends, you can use ${this.is2014 ? "an action" : "a Magic action"} to exhale energy in a 15-foot cone (the spell's Breathe activity).`,
      },
      data: {
        _id: DragonsBreath.RIDER_EFFECT_ID,
      },
    };
  }

  enchantmentProfile(level: number, effectIdLevel: { min: number; max: number | null }): IDDBEffectHint {
    const part = DragonsBreath.damagePart(level);
    return {
      name: `Dragon's Breath (${part.number}d6)`,
      type: "enchant",
      activityMatch: DragonsBreath.CAST_NAME,
      options: {
        durationSeconds: 60,
      },
      changes: [
        ...endSpellChanges(DragonsBreath.CAST_ID, "End Dragon's Breath"),
        // a single part, not an array: the stored value arrives parsed, and an ArrayField only
        // parses a string, so an array would be nested inside the parts list
        DDBEnricherData.ChangeHelper.overrideChange(JSON.stringify(part), 20, "activities[save].damage.parts"),
      ],
      data: {
        _id: DragonsBreath.profileId(level),
        flags: {
          ddbimporter: {
            ...riders({ activities: [DragonsBreath.BREATHE_ID], effects: [DragonsBreath.RIDER_EFFECT_ID] }),
            effectIdLevel,
          },
        },
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    const profiles = slotLevels(DragonsBreath.BASE_LEVEL)
      .map(({ level, effectIdLevel }) => this.enchantmentProfile(level, effectIdLevel));
    return [this.riderEffect, ...profiles];
  }

}
