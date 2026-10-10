import DDBEnricherData from "../data/DDBEnricherData";
import WeaponProperties from "./_WeaponProperties";
import HoardItem from "./_HoardItem";
import { fabledLevel } from "./_FabledItem";
import { itemActivity, itemProperty } from "./_ItemActivities";

/**
 * The Grave Blade, a fabled longsword DDB ships as one record per level ("(Lv. 9)") plus an
 * unsuffixed record describing every level, read as level 20.
 * - 5th: once per dawn, drop to 1 hit point instead of 0, with advantage against the attacker
 * - 9th: +1 and an extra 1d6 necrotic on a hit (+2 at 13th, +3 at 17th)
 * - 13th: a living creature it damages makes a DC 15 Charisma save or is frightened until the end
 *   of its next turn
 * - 17th: once per dawn, on a hit against a creature with 50 hit points or fewer, compel it to die
 */
export default class TheGraveBlade extends WeaponProperties {

  static FRIGHTEN = "Grave Song";

  get level(): number {
    return fabledLevel(this.recordName);
  }

  override get activity(): IDDBActivityData {
    return {
      noeffect: true,
      data: {
        duration: { override: true, value: "", units: "inst", special: "" },
        damage: {
          includeBase: true,
          parts: this.level >= 9
            ? [DDBEnricherData.basicDamagePart({ number: 1, denomination: 6, types: ["necrotic"] })]
            : [],
        },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    const activities: IDDBAdditionalActivity[] = [];
    if (this.level >= 5) {
      activities.push(HoardItem.oncePerDawn(HoardItem.withDuration(itemActivity("Refuse to Fall", DDBEnricherData.ACTIVITY_TYPES.UTILITY, {}, {
        activationOverride: {
          type: "special",
          value: null,
          condition: "You are reduced to 0 hit points but not killed outright: drop to 1 hit point instead. If a creature dealt the damage, you have advantage on attack rolls against it for 1 minute",
        },
      }))));
    }
    if (this.level >= 13) {
      activities.push(HoardItem.withDuration(itemProperty(TheGraveBlade.FRIGHTEN, DDBEnricherData.ACTIVITY_TYPES.SAVE, {
        save: { ability: ["cha"], formula: "15" },
        condition: "The sword deals damage to a living creature",
      })));
    }
    if (this.level >= 17) {
      activities.push(HoardItem.oncePerDawn(HoardItem.withDuration(itemActivity("Compel Death", DDBEnricherData.ACTIVITY_TYPES.UTILITY, {}, {
        activationOverride: {
          type: "special",
          value: null,
          condition: "You hit a creature that has 50 hit points or fewer: compel it to die",
        },
      }))));
    }
    return activities;
  }

  override get effects(): IDDBEffectHint[] {
    if (this.level < 13) return [];
    return [
      {
        name: "Grave Song: Frightened",
        activityMatch: TheGraveBlade.FRIGHTEN,
        statuses: ["Frightened"],
        options: { transfer: false, durationSeconds: 6 },
      },
    ];
  }

  override get override(): IDDBOverrideData {
    // the unsuffixed record lists every level's bonus, which the parser reads as the lowest
    return this.level >= 20 ? { data: { system: { magicalBonus: 3 } } } : {};
  }

}
