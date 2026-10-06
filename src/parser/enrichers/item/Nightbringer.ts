import DDBEnricherData from "../data/DDBEnricherData";
import WeaponProperties from "./_WeaponProperties";
import { itemProperty, itemUses, weaponRange } from "./_ItemActivities";

/**
 * Nightbringer, which DDB ships as two records: the plain mace and "Nightbringer (Evil
 * Alignment)", which carries the evil wielder's modifiers and the charges. Both build the same
 * weapon, and a character holding both keeps one (`STATE_COPIES`).
 *
 * Every wielder gets the +3 mace and its extra 4d4 radiant (DDB's modifier, on the attack). An evil
 * attuned wielder also gets Blessing of the Dragon Queen (immune to charmed and frightened, plus a
 * damage immunity chosen on attunement, left to the player) and Eyes of Midnight (darkvision 60
 * feet, or 60 more), as one passive effect gated by an effect-level condition on the actor's
 * alignment. Midnight Shroud spends one of 6 charges on a hit: a DC 20 Constitution save or
 * blinded until the start of your next turn. An activity cannot be gated on alignment, so its
 * name says so.
 */
export default class Nightbringer extends WeaponProperties {

  static SHROUD = "Midnight Shroud (Evil Only)";

  // the evil record's modifiers would otherwise apply to every wielder; the gated effect below
  // carries them
  override get clearAutoEffects(): boolean {
    return true;
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      itemProperty(Nightbringer.SHROUD, DDBEnricherData.ACTIVITY_TYPES.SAVE, {
        save: { ability: ["con"], formula: "20" },
        condition: "When you hit a creature with the mace, if you have an evil alignment",
        range: weaponRange(this),
        charges: "1",
      }),
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Nightbringer: Evil Alignment",
        options: {
          transfer: true,
          durationSeconds: null,
          expiry: null,
          description: "While attuned and of evil alignment: immune to the charmed and frightened conditions, immune to one damage type chosen on attunement (acid, cold, fire, lightning, or poison), and darkvision 60 feet (or 60 feet more).",
        },
        changes: [
          DDBEnricherData.ChangeHelper.conditionImmunityChange("charmed"),
          DDBEnricherData.ChangeHelper.conditionImmunityChange("frightened"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("60", 20, "system.attributes.senses.ranges.darkvision"),
        ],
        // an effect-level condition is checked at data prep against the actor, so it suppresses the
        // whole effect for a wielder who is not evil
        data: { system: { conditions: JSON.stringify({ k: "details.alignment", o: "icontains", v: "evil" }) } },
      },
      {
        name: "Midnight Shroud: Blinded",
        activityMatch: Nightbringer.SHROUD,
        statuses: ["Blinded"],
        options: {
          transfer: false,
          expiry: "sourceStart",
          description: "Blinded until the start of the Nightbringer wielder's next turn.",
        },
      },
    ];
  }

  // the plain record carries no charges on a character import
  override get override(): IDDBOverrideData {
    return itemUses(this, "6", [{ period: "dawn", type: "formula", formula: "1d6" }]);
  }

}
