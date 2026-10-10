import DDBEnricherData from "../data/DDBEnricherData";
import { itemProperty, noExtraAttackDamage, weaponRange } from "./_ItemActivities";

/**
 * Storm Boomerang: a hit deals 1d4 bludgeoning, plus 3d4 thunder and a DC 10 Constitution save
 * against being stunned until the end of the target's next turn. The thunder and the stun go
 * together and only once: after the boomerang deals thunder damage it loses both until it spends
 * an hour inside an elemental air node. So the attack rolls the 1d4 alone, and the thunder and the
 * stun are one save activity with a single use of its own, which the player restores by hand.
 */
export default class StormBoomerang extends DDBEnricherData {

  static THUNDER = "Thunderous Strike";

  override get activity(): IDDBActivityData {
    return noExtraAttackDamage();
  }

  // the parser's save rider and its auto stun effect are replaced by the strike below
  override get addAutoAdditionalActivities(): boolean {
    return false;
  }

  override get clearAutoStatusEffect(): boolean {
    return true;
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    const strike = itemProperty(StormBoomerang.THUNDER, DDBEnricherData.ACTIVITY_TYPES.SAVE, {
      save: { ability: ["con"], formula: "10" },
      damageParts: [DDBEnricherData.basicDamagePart({ number: 3, denomination: 4, types: ["thunder"] })],
      // the thunder lands whether or not the target resists the stun
      onSave: "full",
      condition: "On a hit while the boomerang still holds its storm; it regains it after spending at least 1 hour inside an elemental air node",
      range: weaponRange(this),
      data: { uses: { spent: 0, max: "1", recovery: [] } },
    });
    return [
      {
        ...strike,
        overrides: { ...strike.overrides, addActivityConsume: true, noConsumeTargets: false },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Storm Boomerang: Stunned",
        activityMatch: StormBoomerang.THUNDER,
        statuses: ["Stunned"],
        options: {
          transfer: false,
          expiry: "targetEnd",
          description: "Stunned until the end of its next turn.",
        },
      },
    ];
  }

}
