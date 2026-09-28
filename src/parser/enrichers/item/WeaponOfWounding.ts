import DDBEnricherData from "../data/DDBEnricherData";
import WeaponProperties from "./_WeaponProperties";
import { itemCheck, itemProperty, textDC } from "./_ItemActivities";

/**
 * Weapons of Wounding: once per turn a hit can wound the target. Each wound deals 1d4 necrotic at
 * the start of its turns, after which it makes a Constitution save that ends all of them; a
 * Wisdom (Medicine) check as an action also ends them. The save ends the wound rather than
 * resisting the hit, so the hit applies the wound and the save is its own activity.
 */
export default class WeaponOfWounding extends WeaponProperties {

  static WOUND = "Wound";

  get dc(): string {
    return textDC(this.text, /DC (\d+) Constitution/i, "15");
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      itemProperty(WeaponOfWounding.WOUND, DDBEnricherData.ACTIVITY_TYPES.UTILITY, {
        condition: "Once per turn, when you hit a creature with this weapon",
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
