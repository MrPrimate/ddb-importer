import DDBEnricherData from "../data/DDBEnricherData";
import WeaponProperties from "./_WeaponProperties";
import HoardItem from "./_HoardItem";
import { fabledLevel } from "./_FabledItem";
import { itemActivity, itemCast, itemProperty, shippedItemSpellNames } from "./_ItemActivities";

/**
 * Storrbani, a fabled longsword DDB ships as one record per level from 5th ("(Lv. 9)") plus an
 * unsuffixed record describing every level, read as level 20. It always deals an extra 1d4 fire
 * (2d6 from 9th), with +1, +2 and +3 at 9th, 13th and 17th, and gains a rune per level:
 * - 5th, Gebo: Shield of Faith on another creature within 60 feet, no concentration, once per short rest
 * - 9th, Tiwaz: lend the extra fire damage to a creature's weapon until the end of your next turn
 * - 13th, Thurisaz: critical hits on 19 or 20 until the end of your next turn; an extra 1d8 on a
 *   critical hit against a giant
 * - 17th, Ansuz: once per dawn, immunity to all damage until the end of your next turn
 *
 * DDB's 17th-level and unsuffixed records grant that immunity permanently, so the parser's effect is
 * replaced.
 */
export default class Storrbani extends WeaponProperties {

  static ANSUZ = "Ansuz Rune";

  get level(): number {
    return fabledLevel(this.recordName);
  }

  override get activity(): IDDBActivityData {
    const fire = this.level >= 9
      ? DDBEnricherData.basicDamagePart({ number: 2, denomination: 6, types: ["fire"] })
      : DDBEnricherData.basicDamagePart({ number: 1, denomination: 4, types: ["fire"] });
    return {
      noeffect: true,
      data: {
        duration: { override: true, value: "", units: "inst", special: "" },
        damage: { includeBase: true, parts: [fire] },
      },
    };
  }

  /** A rune touched as a bonus action. */
  rune(name: string, condition: string, noeffect = true): IDDBAdditionalActivity {
    // each rune lasts until the end of your next turn
    return HoardItem.withDuration(itemActivity(name, DDBEnricherData.ACTIVITY_TYPES.UTILITY, { noeffect }, {
      activationOverride: { type: "bonus", value: 1, condition },
    }), "round", "1");
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    const activities: IDDBAdditionalActivity[] = [];
    if (this.level >= 5 && !shippedItemSpellNames(this).includes("Shield of Faith")) {
      const cast = itemCast("Shield of Faith");
      activities.push({
        ...cast,
        build: {
          ...cast.build,
          spellOverride: { ...cast.build?.spellOverride, properties: ["vocal", "somatic", "material", "concentration"] },
        },
        overrides: {
          ...cast.overrides,
          noConsumeTargets: false,
          addActivityConsume: true,
          data: { uses: { spent: 0, max: "1", recovery: [{ period: "sr", type: "recoverAll" }] } },
        },
      } as IDDBAdditionalActivity);
    }
    if (this.level >= 9) {
      activities.push(this.rune("Tiwaz Rune", "Give the blade's extra fire damage to the weapon of a creature you can see within 60 feet until the end of your next turn"));
    }
    if (this.level >= 13) {
      activities.push(this.rune("Thurisaz Rune", "Your attacks with Storrbani score a critical hit on a 19 or 20 until the end of your next turn"));
      activities.push(HoardItem.withDuration(itemProperty("Giant Slayer", DDBEnricherData.ACTIVITY_TYPES.DAMAGE, {
        damageParts: [DDBEnricherData.basicDamagePart({ number: 1, denomination: 8, types: ["slashing"] })],
        condition: "You score a critical hit against a giant",
        noeffect: true,
      })));
    }
    if (this.level >= 17) {
      activities.push(HoardItem.oncePerDawn(this.rune(Storrbani.ANSUZ, "Gain immunity to all damage until the end of your next turn", false)));
    }
    return activities;
  }

  override get effects(): IDDBEffectHint[] {
    if (this.level < 17) return [];
    return [
      {
        name: "Ansuz Rune: Immunity",
        activityMatch: Storrbani.ANSUZ,
        changes: [DDBEnricherData.ChangeHelper.addChange("ALL", 20, "system.traits.di.value")],
        options: { transfer: false, durationSeconds: 12 },
      },
    ];
  }

  override get override(): IDDBOverrideData {
    // the unsuffixed record lists every level's bonus, which the parser reads as the lowest
    return this.level >= 20 ? { data: { system: { magicalBonus: 3 } } } : {};
  }

}
