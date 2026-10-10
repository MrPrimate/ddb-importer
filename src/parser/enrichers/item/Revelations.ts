import DDBEnricherData from "../data/DDBEnricherData";
import TrickWeapon from "./_TrickWeapon";
import { itemProperty } from "./_ItemActivities";

/**
 * Revelations: a +1 Cleaver that transforms into a Whip (1d6 Slashing, Versatile 1d8, no Finesse).
 * The wielder is immune to Blinded. Transformed, a hit once per turn can crush the target. The
 * Untransformed curse (+1 damage, 19-20 critical hits and tracking against the cursed target),
 * immunity to surprise and the Devour Sight curse stay in the description.
 */
export default class Revelations extends TrickWeapon {

  get weaponName(): string {
    return "Revelations";
  }

  get transformedCopyName(): string {
    return "Revelations (Whip)";
  }

  override get magicBonus(): number {
    return 1;
  }

  get untransformed(): ITrickWeaponForm {
    return {
      label: "Cleaver",
      typeValue: "martialM",
      // Steinhardt's Cleaver has no dnd5e base item
      baseItem: "",
      number: 1,
      denomination: 10,
      damageType: "slashing",
      versatile: { number: 1, denomination: 12 },
      properties: ["hvy", "ver"],
      mastery: "graze",
      range: { value: 5 },
      attackType: "melee",
    };
  }

  get transformed(): ITrickWeaponForm {
    return {
      label: "Whip",
      typeValue: "martialM",
      baseItem: "whip",
      number: 1,
      denomination: 6,
      damageType: "slashing",
      versatile: { number: 1, denomination: 8 },
      properties: ["rch", "ver"],
      mastery: "slow",
      range: { value: 10 },
      attackType: "melee",
    };
  }

  override get transformedActivityRiders(): string[] {
    return [
      TrickWeapon.propertyActivityId("Crush"),
    ];
  }

  override get propertyActivities(): IDDBAdditionalActivity[] {
    return [
      itemProperty("Crush", DDBEnricherData.ACTIVITY_TYPES.SAVE, {
        save: { ability: ["str"], calculation: "str" },
        damageParts: [DDBEnricherData.basicDamagePart({ number: 1, denomination: 6, types: ["slashing"] })],
        condition: "Transformed: once on each of your turns when you hit a creature",
      }),
    ];
  }

  override get passiveEffects(): IDDBEffectHint[] {
    return [
      {
        name: "Crush: Prone",
        activityMatch: "Crush",
        statuses: ["Prone"],
        options: { transfer: false },
      },
      {
        name: "Revelations",
        options: {
          transfer: true,
          durationSeconds: null,
          description: "You are immune to the Blinded condition while holding Revelations, and you can't be surprised.",
        },
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("blinded", 20, "system.traits.ci.value"),
        ],
      },
    ];
  }

}
