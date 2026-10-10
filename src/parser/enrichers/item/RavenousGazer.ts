import DDBEnricherData from "../data/DDBEnricherData";
import utils from "../../../lib/Utils";
import TrickWeapon from "./_TrickWeapon";
import { itemProperty } from "./_ItemActivities";

/**
 * Ravenous Gazer: a +1 Glaive its wielder is proficient with. Transformed, it is a Spellcasting
 * Focus and grants +2 to spell attack rolls, +1 to spell save DCs and 30 ft Truesight, at the cost
 * of 1d4 Necrotic damage when it transforms and at the start of each turn it stays Transformed.
 */
export default class RavenousGazer extends TrickWeapon {

  static TRANSFORMED_BONUS_ID = utils.namedIDStub("Ravenous Gazer Transformed Bonus", { prefix: "ddb" });

  get weaponName(): string {
    return "Ravenous Gazer";
  }

  get transformedCopyName(): string {
    return "Ravenous Gazer (Transformed)";
  }

  override get magicBonus(): number {
    return 1;
  }

  get untransformed(): ITrickWeaponForm {
    return {
      label: "Glaive",
      typeValue: "martialM",
      baseItem: "glaive",
      number: 1,
      denomination: 10,
      damageType: "slashing",
      properties: ["hvy", "rch", "two"],
      mastery: "graze",
      range: { value: 10 },
      attackType: "melee",
    };
  }

  get transformed(): ITrickWeaponForm {
    return { ...this.untransformed, label: "Transformed", properties: ["hvy", "rch", "two", "foc"] };
  }

  // "Any creature that attunes to this glaive is considered proficient with it"
  override get systemData(): Record<string, unknown> {
    return { proficient: 1 };
  }

  override get transformedEffectRiders(): string[] {
    return [RavenousGazer.TRANSFORMED_BONUS_ID];
  }

  override get transformedActivityRiders(): string[] {
    return [
      TrickWeapon.propertyActivityId("Feed the Gazer"),
    ];
  }

  override get propertyActivities(): IDDBAdditionalActivity[] {
    return [
      itemProperty("Feed the Gazer", DDBEnricherData.ACTIVITY_TYPES.DAMAGE, {
        damageParts: [DDBEnricherData.basicDamagePart({ number: 1, denomination: 4, types: ["necrotic"] })],
        condition: "When you transform it, and at the start of each of your turns while Transformed. Can't be reduced or prevented, and doesn't break Concentration",
        selfTarget: true,
        noeffect: true,
      }),
    ];
  }

  override get passiveEffects(): IDDBEffectHint[] {
    return [
      {
        // a rider of the Transform enchantment: dnd5e suppresses it here and creates a live copy
        // with the enchantment, so the bonuses only apply while Transformed
        name: "Ravenous Gazer: Transformed Bonuses",
        options: {
          transfer: true,
          durationSeconds: null,
          description: "+2 to spell attack rolls, +1 to your spell save DC and Truesight 30 ft while the gazer is Transformed.",
        },
        data: {
          _id: RavenousGazer.TRANSFORMED_BONUS_ID,
        },
        changes: [
          DDBEnricherData.ChangeHelper.signedAddChange("2", 20, "system.bonuses.msak.attack"),
          DDBEnricherData.ChangeHelper.signedAddChange("2", 20, "system.bonuses.rsak.attack"),
          DDBEnricherData.ChangeHelper.signedAddChange("1", 20, "system.bonuses.spell.dc"),
          DDBEnricherData.ChangeHelper.upgradeChange("30", 20, "system.attributes.senses.truesight"),
        ],
      },
    ];
  }

}
