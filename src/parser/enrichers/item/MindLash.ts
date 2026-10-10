import DDBEnricherData from "../data/DDBEnricherData";
import {
  conditionalWeaponDamage,
  itemProperty,
  noExtraAttackDamage,
  unrestrictedDamageParts,
  weaponRange,
} from "./_ItemActivities";

/**
 * Mind Lash: in the hands of an illithid it deals an extra 2d4 psychic on a hit, and is a plain
 * whip for anyone else, so the die is its own damage activity (dnd5e 5.x has no rule conditions to
 * gate it on the attack). A creature taking that psychic damage makes a DC 15 Wisdom save or has disadvantage on Intelligence, Wisdom
 * and Charisma saves for a minute, repeating the save at the end of each of its turns.
 */
export default class MindLash extends DDBEnricherData {

  static STRIP = "Strip Will";

  // the parser's action-timed copy of the save
  override get addAutoAdditionalActivities(): boolean {
    return false;
  }

  override get activity(): IDDBActivityData | null {
    return unrestrictedDamageParts(this).length > 0 ? noExtraAttackDamage() : null;
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    const parts = unrestrictedDamageParts(this);
    return [
      ...(parts.length > 0 ? [conditionalWeaponDamage("Illithid Wielder", parts, "When an illithid wielding the whip hits")] : []),
      itemProperty(MindLash.STRIP, DDBEnricherData.ACTIVITY_TYPES.SAVE, {
        save: { ability: ["wis"], formula: "15" },
        condition: "A creature that takes psychic damage from the mind lash",
        range: weaponRange(this),
        noeffect: false,
      }),
    ];
  }

  override get effects(): IDDBEffectHint[] {
    const helper = DDBEnricherData.ChangeHelper;
    return [
      {
        name: "Mind Lash: Will Stripped",
        activityMatch: MindLash.STRIP,
        options: {
          transfer: false,
          durationSeconds: 60,
          // lasts the minute unless a save at the end of its turn ends it
          expiry: null,
          description: "Disadvantage on Intelligence, Wisdom and Charisma saving throws. Repeat the DC 15 Wisdom saving throw at the end of each turn, ending the effect on a success.",
        },
        changes: ["int", "wis", "cha"].map((ability) => helper.abilitySaveRollModeChange(ability, helper.DISADVANTAGE)),
        midiChanges: [
          helper.customChange("turn=end, saveAbility=wis, saveDC=15, saveRemove=true, label=Mind Lash", 20, "flags.midi-qol.OverTime"),
        ],
      },
    ];
  }

}
