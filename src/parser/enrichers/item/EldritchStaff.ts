import DDBEnricherData from "../data/DDBEnricherData";
import WeaponProperties from "./_WeaponProperties";
import { itemActivity, itemProperty, noExtraAttackDamage, weaponRange } from "./_ItemActivities";

/**
 * Eldritch Staff: a +1 quarterstaff with 10 charges. Eldritch Attack spends up to 3 charges on a
 * melee hit for an extra 1d8 lightning per charge; DDB's "Per Charge (Max 3)" modifier put a
 * single 1d8 on every hit, so the attack rolls none and the charge activity scales instead.
 * Eldritch Escape spends 3 charges as a reaction to taking damage: you teleport up to 60 feet and
 * are invisible until the start of your next turn, or until you attack, cast a spell or deal
 * damage.
 */
export default class EldritchStaff extends WeaponProperties {

  static ESCAPE = "Eldritch Escape";

  override get activity(): IDDBActivityData {
    return { ...noExtraAttackDamage(), noeffect: true };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      itemProperty("Eldritch Attack", DDBEnricherData.ACTIVITY_TYPES.DAMAGE, {
        damageParts: [DDBEnricherData.basicDamagePart({ customFormula: "(@scaling)d8", types: ["lightning"] })],
        condition: "When you hit with a melee attack using the staff: 1d8 lightning per charge, up to 3",
        range: weaponRange(this),
        charges: "1",
        scalingMax: "min(3, @item.uses.value)",
        noeffect: true,
      }),
      itemActivity(EldritchStaff.ESCAPE, DDBEnricherData.ACTIVITY_TYPES.UTILITY, {
        noeffect: false,
        addItemConsume: true,
        itemConsumeValue: "3",
        noConsumeTargets: false,
      }, {
        activationOverride: { type: "reaction", value: 1, condition: "When you take damage while holding the staff: teleport with your gear to an unoccupied space you can see" },
        rangeOverride: { value: "60", units: "ft" },
      }),
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Eldritch Escape: Invisible",
        activityMatch: EldritchStaff.ESCAPE,
        statuses: ["Invisible"],
        options: {
          transfer: false,
          durationSeconds: 6,
          expiry: "turnStart",
          description: "Invisible until the start of your next turn, or until you attack, cast a spell, or deal damage.",
        },
      },
    ];
  }

}
