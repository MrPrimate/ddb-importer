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
 * feet, or 60 more), as one passive effect. dnd5e 5.x cannot gate an effect on alignment, so it is
 * enabled on the "(Evil Alignment)" record and disabled on the plain one, for the player to switch
 * on. Midnight Shroud spends one of 6 charges on a hit: a DC 20 Constitution save or
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
    const evilRecord = (/evil alignment/i).test(this.ddbParser?.originalName ?? "");
    return [
      {
        name: "Nightbringer: Evil Alignment",
        options: {
          transfer: true,
          disabled: !evilRecord,
          durationSeconds: null,
          expiry: null,
          description: "While attuned and of evil alignment: immune to the charmed and frightened conditions, immune to one damage type chosen on attunement (acid, cold, fire, lightning, or poison), and darkvision 60 feet (or 60 feet more).",
        },
        changes: [
          DDBEnricherData.ChangeHelper.conditionImmunityChange("charmed"),
          DDBEnricherData.ChangeHelper.conditionImmunityChange("frightened"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("60", 20, "system.attributes.senses.darkvision"),
        ],
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
