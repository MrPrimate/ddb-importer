import DDBEnricherData from "../data/DDBEnricherData";
import FabledItem from "./_FabledItem";
import HoardItem from "./_HoardItem";
import { itemActivity, itemCast, itemUses, shippedItemSpellNames } from "./_ItemActivities";

/**
 * Skinchanger Arm Ring, a fabled ring DDB ships as one record per level ("(Lv. 13)") plus an
 * unsuffixed record describing every level, read as level 20.
 * - 5th: once per dawn, raven wings for 1 hour: a 50-foot flying speed, one size smaller,
 *   disadvantage on Strength checks and saves, 1d4 less weapon and unarmed damage
 * - 9th: advantage on melee attacks against a creature next to a conscious ally (text only)
 * - 13th: once per dawn, temporary hit points equal to twice your level and cold resistance until
 *   they are gone or you finish a long rest
 * - 17th: 3 charges (1d3 back at dawn), 1 charge casts Polymorph on yourself (raven, wolf, dire wolf
 *   or bear forms)
 *
 * DDB's records grant the wings' flying speed and disadvantages permanently, so the parser's
 * effects are replaced.
 */
export default class SkinchangerArmRing extends FabledItem {

  static WINGS = "Raven Wings";

  static BEAR = "Bear's Endurance";

  override get clearAutoEffects(): boolean {
    return true;
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    const activities: IDDBAdditionalActivity[] = [];
    if (this.level >= 5) {
      activities.push(HoardItem.oncePerDawn(itemActivity(SkinchangerArmRing.WINGS, DDBEnricherData.ACTIVITY_TYPES.UTILITY, { noeffect: false }, {
        activationOverride: { type: "action", value: 1, condition: "" },
        generateDuration: true,
        durationOverride: { override: true, value: "1", units: "hour" },
      })));
    }
    if (this.level >= 13) {
      const endurance = itemActivity(SkinchangerArmRing.BEAR, DDBEnricherData.ACTIVITY_TYPES.HEAL, { noeffect: false }, {
        activationOverride: { type: "action", value: 1, condition: "" },
        generateHealing: true,
        healingPart: DDBEnricherData.basicDamagePart({ bonus: "2 * @details.level", types: ["temphp"] }),
      });
      activities.push(HoardItem.oncePerDawn(HoardItem.withDuration(endurance)));
    }
    if (this.level >= 17 && !shippedItemSpellNames(this).includes("Polymorph")) {
      activities.push(itemCast("Polymorph", { charges: 1 }));
    }
    return activities;
  }

  override get override(): IDDBOverrideData {
    if (this.level < 17) return super.override;
    return itemUses(this, "3", [{ period: "dawn", type: "formula", formula: "1d3" }]);
  }

  override get effects(): IDDBEffectHint[] {
    const effects: IDDBEffectHint[] = [];
    if (this.level >= 5) {
      effects.push({
        name: "Raven Wings",
        activityMatch: SkinchangerArmRing.WINGS,
        changes: [
          DDBEnricherData.ChangeHelper.upgradeChange("50", 20, "system.attributes.movement.fly"),
          DDBEnricherData.ChangeHelper.abilityCheckRollModeChange("str", -1),
          DDBEnricherData.ChangeHelper.abilitySaveRollModeChange("str", -1),
        ],
        options: {
          transfer: false,
          durationSeconds: 3600,
          description: "Your size decreases by one category, and your attacks with weapons or Unarmed Strikes deal 1d4 less damage on a hit (minimum 1). You can end the wings early as a Bonus Action.",
        },
      });
    }
    if (this.level >= 13) {
      effects.push({
        name: "Bear's Endurance: Cold Resistance",
        activityMatch: SkinchangerArmRing.BEAR,
        changes: [DDBEnricherData.ChangeHelper.damageResistanceChange("cold")],
        options: {
          transfer: false,
          durationSeconds: null,
          expiry: null,
          description: "Lasts until the temporary hit points are gone or you finish a long rest.",
        },
      });
    }
    return effects;
  }

}
