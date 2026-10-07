import DDBEnricherData from "../data/DDBEnricherData";
import WeaponProperties from "./_WeaponProperties";
import { itemActivity, itemProperty } from "./_ItemActivities";

/**
 * Kinesthetic Projection: a +2 shortsword with an extra 1d6 psychic on a hit (DDB's "On hit"
 * modifier, on the attack). Its curse fuses it to your hand, and you take 1d6 psychic whenever you
 * finish a short or long rest while it is attached: DDB's "After short or long rest" modifier, which
 * the parser built as an attack, is that self damage instead. Visceral Reach spends 2 Hit Dice as a
 * bonus action to extend the blade's reach by 10 feet for 1 minute, a self enchantment; during it an
 * action attack against a creature within 30 feet that hits pulls it up to 25 feet toward you on a
 * failed DC 17 Strength save.
 */
export default class KinestheticProjection extends WeaponProperties {

  static REACH = "Visceral Reach";

  // the 1d6 psychic on every hit is set on the attack: the curse's self damage rolls the same die,
  // which the parser would otherwise read as already rolling it; the 1 minute is Visceral Reach's
  override get activity(): IDDBActivityData {
    return {
      noeffect: true,
      data: {
        damage: { includeBase: true, parts: [DDBEnricherData.basicDamagePart({ number: 1, denomination: 6, types: ["psychic"] })] },
        duration: { value: "", units: "inst" },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      itemProperty("Curse: Violent Nightmares", DDBEnricherData.ACTIVITY_TYPES.DAMAGE, {
        damageParts: [DDBEnricherData.basicDamagePart({ number: 1, denomination: 6, types: ["psychic"] })],
        condition: "Whenever you finish a short or long rest while the sword is attached to your hand, attuned or not",
        selfTarget: true,
        noeffect: true,
      }),
      itemActivity(KinestheticProjection.REACH, DDBEnricherData.ACTIVITY_TYPES.ENCHANT, {
        noeffect: false,
        activationType: "bonus",
        activationCondition: "Spend 2 Hit Dice: the blade's reach extends by 10 feet for 1 minute",
        additionalConsumptionTargets: [{ type: "hitDice", target: "smallest", value: "2", scaling: { mode: "", formula: "" } }],
        data: {
          enchant: { self: true },
          restrictions: { type: "weapon", allowMagical: true },
          duration: { value: "1", units: "minute" },
        },
      }),
      itemProperty("Visceral Pull", DDBEnricherData.ACTIVITY_TYPES.SAVE, {
        save: { ability: ["str"], formula: "17" },
        condition: "During Visceral Reach, when an action melee weapon attack with the sword hits a creature within 30 feet: it is pulled up to 25 feet directly toward you on a failure",
        range: { value: "30", units: "ft" },
        noeffect: true,
      }),
    ];
  }

  override get effects(): IDDBEffectHint[] {
    const helper = DDBEnricherData.ChangeHelper;
    return [
      {
        type: "enchant",
        name: "Kinesthetic Projection: Visceral Reach",
        activityMatch: KinestheticProjection.REACH,
        changes: [
          helper.overrideChange("15", 20, "system.range.reach"),
          // the sword's only enchant activity is Visceral Reach: using it again ends the reach, free
          helper.overrideChange("End Visceral Reach", 20, "activities[enchant].name"),
          helper.overrideChange("[]", 20, "activities[enchant].consumption.targets"),
        ],
        options: {
          transfer: false,
          durationSeconds: 60,
          expiry: null,
          description: "The blade's reach extends by 10 feet for 1 minute.",
        },
      },
    ];
  }

}
