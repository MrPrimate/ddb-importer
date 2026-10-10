import DDBEnricherData from "../data/DDBEnricherData";
import WeaponProperties from "./_WeaponProperties";
import { itemProperty, noExtraAttackDamage } from "./_ItemActivities";

/**
 * Staff of the Dream Shepherd: once per dawn (the item's use) an action summons spectral sheep in
 * a 20 foot long, 10 foot wide line from you. Creatures of your choice in it make a Wisdom save
 * against your spell save DC: 2d6 psychic, half on a success, and one that fails with 20 hit points
 * or fewer left falls asleep (unconscious) for 1 minute, until it takes damage or is shaken awake;
 * undead and creatures immune to being charmed don't. DDB's modifier for that 2d6 put it on every
 * hit; it is the save's damage instead.
 */
export default class StaffOfTheDreamShepherd extends WeaponProperties {

  static SHEEP = "Spectral Sheep";

  override get activity(): IDDBActivityData {
    return { ...noExtraAttackDamage(), noeffect: true };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      itemProperty(StaffOfTheDreamShepherd.SHEEP, DDBEnricherData.ACTIVITY_TYPES.SAVE, {
        save: { ability: ["wis"], calculation: "spellcasting" },
        damageParts: [DDBEnricherData.basicDamagePart({ number: 2, denomination: 6, types: ["psychic"] })],
        onSave: "half",
        activationType: "action",
        condition: "While holding the staff; creatures of your choice in the line. Once per dawn",
        template: { type: "line", size: "20", width: "10" },
        range: { value: null, units: "self" },
        charges: "1",
        noeffect: false,
        data: { target: { affects: { choice: true } } },
      }),
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Spectral Sheep: Asleep",
        activityMatch: StaffOfTheDreamShepherd.SHEEP,
        statuses: ["Unconscious"],
        options: {
          transfer: false,
          durationSeconds: 60,
          expiry: null,
          description: "Only a creature that failed the save and has 20 hit points or fewer after the damage falls asleep; undead and creatures immune to being charmed don't. It wakes after 1 minute, when it takes damage, or when someone uses an action to shake or slap it awake.",
        },
      },
    ];
  }

}
