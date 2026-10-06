import DDBEnricherData from "../data/DDBEnricherData";
import WeaponProperties from "./_WeaponProperties";
import { itemCheck, itemProperty, textDC, weaponRange } from "./_ItemActivities";

/**
 * Weapons of Wounding, in two printings.
 *
 * 2014: once per turn a hit can wound the target. Each wound deals 1d4 necrotic at the start of
 * its turns, after which it makes a Constitution save that ends all of them; a Wisdom (Medicine)
 * check as an action also ends them. The save ends the wound rather than resisting the hit, so the
 * hit applies the wound and the save is its own activity.
 *
 * 2024: a hit deals an extra 2d6 necrotic (DDB's modifier, on the attack) and the target makes a
 * Constitution save or can't regain hit points for 1 hour, repeating the save at the end of each
 * of its turns. The save is the hit's rider, so it carries the Wounded effect.
 */
export default class WeaponOfWounding extends WeaponProperties {

  static WOUND = "Wound";

  static WOUNDING = "Wounding";

  get dc(): string {
    return textDC(this.text, /DC (\d+) Constitution/i, "15");
  }

  /** The 2024 printing, whose hit forces a save against losing healing. */
  get isSavePrinting(): boolean {
    return (/unable to regain Hit Points/i).test(this.text);
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    if (this.isSavePrinting) {
      return [
        itemProperty(WeaponOfWounding.WOUNDING, DDBEnricherData.ACTIVITY_TYPES.SAVE, {
          save: { ability: ["con"], formula: this.dc },
          condition: "When you hit a creature with this weapon",
          range: weaponRange(this),
        }),
      ];
    }
    return [
      itemProperty(WeaponOfWounding.WOUND, DDBEnricherData.ACTIVITY_TYPES.UTILITY, {
        condition: "Once per turn, when you hit a creature with this weapon",
        range: weaponRange(this),
      }),
      itemProperty("Wound Damage", DDBEnricherData.ACTIVITY_TYPES.DAMAGE, {
        damageParts: [DDBEnricherData.basicDamagePart({ number: 1, denomination: 4, types: ["necrotic"] })],
        condition: "At the start of each of the wounded creature's turns, 1d4 for each wound",
        noeffect: true,
      }),
      itemProperty("End Wounds", DDBEnricherData.ACTIVITY_TYPES.SAVE, {
        save: { ability: ["con"], formula: this.dc },
        condition: "The wounded creature, after taking its wound damage; a success ends all its wounds",
        noeffect: true,
      }),
      itemCheck("Treat Wounds", {
        ability: "wis",
        skill: "med",
        dc: this.dc,
        condition: "The wounded creature or a creature within 5 feet of it; a success ends the wounds",
      }),
    ];
  }

  override get effects(): IDDBEffectHint[] {
    if (this.isSavePrinting) {
      return [
        {
          name: "Wounded",
          activityMatch: WeaponOfWounding.WOUNDING,
          options: {
            transfer: false,
            durationSeconds: 3600,
            // lasts the hour unless a save at the end of its turn ends it, not to the turn's start
            expiry: null,
            description: `Can't regain hit points for 1 hour. Repeats the DC ${this.dc} Constitution save at the end of each of its turns, ending the effect on a success.`,
          },
          midiChanges: [
            DDBEnricherData.ChangeHelper.customChange(
              `turn=end, saveAbility=con, saveDC=${this.dc}, saveRemove=true, label=Wounded`,
              20,
              "flags.midi-qol.OverTime",
            ),
          ],
        },
      ];
    }
    return [
      {
        name: "Wounded",
        activityMatch: WeaponOfWounding.WOUND,
        options: {
          transfer: false,
          durationSeconds: null,
          description: `Takes 1d4 necrotic damage for each wound at the start of each of its turns, then makes a DC ${this.dc} Constitution save, ending all wounds on a success. Hit points lost to the weapon return only with a rest.`,
        },
        midiChanges: [
          DDBEnricherData.ChangeHelper.customChange(
            `turn=start, damageRoll=1d4, damageType=necrotic, saveAbility=con, saveDC=${this.dc}, saveRemove=true, label=Wounded`,
            20,
            "flags.midi-qol.OverTime",
          ),
        ],
      },
    ];
  }

}
