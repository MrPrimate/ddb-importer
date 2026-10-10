import DDBEnricherData from "../data/DDBEnricherData";
import TrickWeapon from "./_TrickWeapon";
import { itemProperty } from "./_ItemActivities";

/**
 * Shard of Moonlight: a +3 Longsword with the Light property and an extra 1d6 Radiant on a hit,
 * which transforms (under direct moonlight) into a Greatsword whose extra Radiant is 2d6 and which
 * can spend the shard's charges. Its wielder is proficient with both. The charges come from Void
 * Absorption (a Reaction that absorbs a spell) and return when the moon changes, so they recover
 * by hand; the Untransformed extra attack, Advantage on Wisdom saves and the sentience stay in the
 * description.
 */
export default class ShardOfMoonlight extends TrickWeapon {

  get weaponName(): string {
    return "Shard of Moonlight";
  }

  get transformedCopyName(): string {
    return "Shard of Moonlight (Greatsword)";
  }

  override get magicBonus(): number {
    return 3;
  }

  override get sharedProperties(): string[] {
    return ["lgt", "foc"];
  }

  get untransformed(): ITrickWeaponForm {
    return {
      label: "Longsword",
      typeValue: "martialM",
      baseItem: "longsword",
      number: 1,
      denomination: 8,
      damageType: "slashing",
      versatile: { number: 1, denomination: 10 },
      properties: ["ver"],
      mastery: "sap",
      range: { value: 5 },
      attackType: "melee",
    };
  }

  get transformed(): ITrickWeaponForm {
    return {
      label: "Greatsword",
      typeValue: "martialM",
      baseItem: "greatsword",
      number: 2,
      denomination: 6,
      damageType: "slashing",
      properties: ["hvy", "two"],
      mastery: "graze",
      range: { value: 5 },
      attackType: "melee",
    };
  }

  override get untransformedAttackParts(): I5eDamagePart[] {
    return [DDBEnricherData.basicDamagePart({ number: 1, denomination: 6, types: ["radiant"] })];
  }

  override get transformActivation(): { type: TActivationCost; condition: string } {
    return {
      type: "bonus",
      condition: "Under direct moonlight. Lasts 1 minute or until ended early, and ends when the shard has no charges",
    };
  }

  override get systemData(): Record<string, unknown> {
    return {
      proficient: 1,
      uses: { spent: 0, max: "10", recovery: [] },
    };
  }

  override get transformedActivityRiders(): string[] {
    return [
      // the extra Radiant grows from 1d6 to 2d6
      TrickWeapon.propertyActivityId("Transformed Radiant"),
      TrickWeapon.propertyActivityId("Revealing Glow"),
      TrickWeapon.propertyActivityId("Transient Moonlight"),
      TrickWeapon.propertyActivityId("Lunar Explosion"),
    ];
  }

  override get propertyActivities(): IDDBAdditionalActivity[] {
    return [
      TrickWeapon.onHitDamage("Transformed Radiant", 1, 6, "radiant"),
      itemProperty("Revealing Glow", DDBEnricherData.ACTIVITY_TYPES.DAMAGE, {
        damageParts: [DDBEnricherData.basicDamagePart({ number: 1, denomination: 12, types: ["radiant"] })],
        charges: "1",
        condition: "Transformed: as part of an attack that hits. Until the start of your next turn the target sheds Dim Light in a 10-foot radius, can't be Invisible, and attack rolls against it have Advantage",
        noeffect: true,
      }),
      itemProperty("Transient Moonlight", DDBEnricherData.ACTIVITY_TYPES.SAVE, {
        save: { ability: ["con"], formula: "18" },
        damageParts: [DDBEnricherData.basicDamagePart({ number: 2, denomination: 12, types: ["radiant"] })],
        onSave: "half",
        charges: "2",
        condition: "Transformed: as part of making an attack",
        template: { type: "line", size: "60", width: "5" },
        range: { value: null, units: "self" },
        noeffect: true,
      }),
      itemProperty("Lunar Explosion", DDBEnricherData.ACTIVITY_TYPES.SAVE, {
        save: { ability: ["dex"], formula: "18" },
        damageParts: [DDBEnricherData.basicDamagePart({ number: 3, denomination: 12, types: ["radiant"] })],
        onSave: "half",
        charges: "3",
        activationType: "action",
        condition: "Transformed, instead of making an attack. A creature that falls Prone within 5 feet of you provokes a Reaction melee weapon attack",
        template: { type: "radius", size: "30" },
        range: { value: null, units: "self" },
      }),
    ];
  }

  override get passiveEffects(): IDDBEffectHint[] {
    return [
      {
        name: "Lunar Explosion: Prone",
        activityMatch: "Lunar Explosion",
        statuses: ["Prone"],
        options: { transfer: false },
      },
    ];
  }

}
