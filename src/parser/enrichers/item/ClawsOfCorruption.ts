import DDBEnricherData from "../data/DDBEnricherData";
import WeaponProperties from "./_WeaponProperties";
import { itemProperty, textDC } from "./_ItemActivities";

/**
 * Claws of Corruption: a charge on a hit curses the target for 1 minute on a failed Wisdom save.
 * A cursed creature that starts its turn under a spell's effect or concentrating takes necrotic
 * damage, which is the curse's, not the save's. DC and dice are read per record.
 */
export default class ClawsOfCorruption extends WeaponProperties {

  static CURSE = "Rakshasa's Corruption";

  get dice(): { number: number; denomination: number } {
    const match = (/(\d+)d(\d+) necrotic/i).exec(this.text);
    return match ? { number: Number(match[1]), denomination: Number(match[2]) } : { number: 1, denomination: 6 };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      itemProperty(ClawsOfCorruption.CURSE, DDBEnricherData.ACTIVITY_TYPES.SAVE, {
        save: { ability: ["wis"], formula: textDC(this.text, /DC (\d+) Wisdom/i, "13") },
        condition: "When you hit a creature with the claws (no action required)",
        charges: "1",
      }),
      itemProperty("Corruption Damage", DDBEnricherData.ACTIVITY_TYPES.DAMAGE, {
        damageParts: [DDBEnricherData.basicDamagePart({ ...this.dice, types: ["necrotic"] })],
        condition: "A cursed creature starts its turn under a spell's effect or concentrating on a spell",
        noeffect: true,
      }),
    ];
  }

  override get effects(): IDDBEffectHint[] {
    const dice = this.dice;
    return [
      {
        name: "Rakshasa's Corruption",
        activityMatch: ClawsOfCorruption.CURSE,
        options: {
          transfer: false,
          durationSeconds: 60,
          description: `Cursed for 1 minute: takes ${dice.number}d${dice.denomination} necrotic damage when it starts its turn under the effect of a spell or while concentrating on one.`,
        },
      },
    ];
  }

  override get override(): IDDBOverrideData {
    return this.textCharges;
  }

}
