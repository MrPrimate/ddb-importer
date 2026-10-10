import DDBEnricherData from "../data/DDBEnricherData";
import WeaponProperties from "./_WeaponProperties";
import { itemCheck, itemProperty, weaponRange } from "./_ItemActivities";

/**
 * Purging Dagger: a +1 dagger with an extra 1d4 radiant on a hit (DDB's modifier, on the attack),
 * rising to 2d4 against an Undead. On a 20 against an Undead you can leave the blade lodged in the
 * target: it sheds sunlight (bright 15 feet, dim 15 more) and the target takes 3d4 radiant at the
 * start of each of its turns until a DC 16 Strength (Athletics) check pulls it out. DDB carries the
 * Undead die and the lodged damage as restricted modifiers, which the parser built as attacks;
 * they are the Undead extra, the lodging utility and the lodged damage instead, beside the
 * Athletics check that removes the dagger.
 */
export default class PurgingDagger extends WeaponProperties {

  static LODGE = "Crit vs Undead";

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      itemProperty("Extra Damage vs Undead", DDBEnricherData.ACTIVITY_TYPES.DAMAGE, {
        damageParts: [DDBEnricherData.basicDamagePart({ number: 1, denomination: 4, types: ["radiant"] })],
        condition: "When you hit an Undead with the dagger: the extra radiant damage rises from 1d4 to 2d4",
        range: weaponRange(this),
        noeffect: true,
      }),
      itemProperty(PurgingDagger.LODGE, DDBEnricherData.ACTIVITY_TYPES.UTILITY, {
        condition: "When you roll a 20 on the d20 for an attack roll with the dagger against an Undead, you can leave the blade lodged in the target",
        range: weaponRange(this),
        noeffect: false,
      }),
      itemProperty("Lodged Blade", DDBEnricherData.ACTIVITY_TYPES.DAMAGE, {
        damageParts: [DDBEnricherData.basicDamagePart({ number: 3, denomination: 4, types: ["radiant"] })],
        condition: "At the start of each of the lodged target's turns, until the dagger is removed",
        range: weaponRange(this),
        noeffect: true,
      }),
      itemCheck("Remove Lodged Dagger", {
        ability: "str",
        skill: "ath",
        dc: "16",
        condition: "An action by the lodged target or a creature within 5 feet of it: removes the dagger on a success, and the blade reappears at your feet or in your free hand",
      }),
    ];
  }

  override get effects(): IDDBEffectHint[] {
    const helper = DDBEnricherData.ChangeHelper;
    return [
      {
        name: "Purging Dagger: Lodged",
        activityMatch: PurgingDagger.LODGE,
        options: {
          transfer: false,
          durationSeconds: null,
          expiry: null,
          description: "The dagger is lodged in this creature, shedding sunlight (bright light in a 15-foot radius and dim light for an additional 15 feet). It takes 3d4 radiant damage at the start of each of its turns. It or a creature within 5 feet of it can use an action to make a DC 16 Strength (Athletics) check, removing the dagger on a success.",
        },
        atlChanges: [
          helper.upgradeChange(15, 20, "ATL.light.bright"),
          helper.upgradeChange(30, 20, "ATL.light.dim"),
        ],
      },
    ];
  }

}
