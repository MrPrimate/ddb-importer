import DDBEnricherData from "../../data/DDBEnricherData";
import MagusMark from "./_MagusMark";

/**
 * Knights Stygian level 3: Aegis makes the attacker save (Constitution) or take Necrotic damage
 * equal to half its attack's damage, which the activity cannot know, so it rolls nothing.
 * Enspell adds 1d4 Necrotic on a hit, 2d4 against a Bloodied target.
 */
export default class ObsidianMark extends MagusMark {

  static enspellDamage(number: number): IDDBActivityData {
    return MagusMark.enspell({
      removeDamageParts: true,
      damageParts: [DDBEnricherData.basicDamagePart({ number, denomination: 4, types: ["necrotic"] })],
    });
  }

  override get markActivities(): IDDBAdditionalActivity[] {
    return [
      MagusMark.markActivity("Aegis", DDBEnricherData.ACTIVITY_TYPES.SAVE, MagusMark.aegis({
        activationCondition: "A creature you can see within 30 feet is hit by an attack; on a failed save the attacker takes Necrotic damage equal to half the attack's damage",
        data: {
          save: {
            ability: ["con"],
            dc: { calculation: "spellcasting", formula: "" },
          },
        },
      }), { generateSave: true }),
      MagusMark.markActivity("Enspell", DDBEnricherData.ACTIVITY_TYPES.DAMAGE, ObsidianMark.enspellDamage(1), { generateDamage: true }),
      MagusMark.markActivity("Enspell (Bloodied)", DDBEnricherData.ACTIVITY_TYPES.DAMAGE, ObsidianMark.enspellDamage(2), { generateDamage: true }),
    ];
  }

}
