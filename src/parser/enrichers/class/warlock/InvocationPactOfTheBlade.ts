import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Pact of the Blade (2024 invocation): a bonus-action enchant that turns a simple or martial
 * melee weapon into the pact weapon (proficient, spellcasting focus, necrotic/psychic/radiant
 * damage options, magical, Charisma attack ability) and rides a "Spellcasting Attack" activity
 * onto it. Mirrors the standard shape.
 *
 * DDB lets the player mark a weapon as the pact weapon; the item parser bakes Charisma and
 * proficiency into that weapon directly, and the character importer's enchantment step applies
 * this enchantment to the same weapon (matched through the scraped `pactWeapon` class-feature
 * flag), so a marked weapon also gets the damage types, focus property and rider.
 */
export default class InvocationPactOfTheBlade extends DDBEnricherData {

  static ACTIVITY_ID = "ddbForgePactWpn1";

  static EFFECT_ID = "ddbPactWeaponEf1";

  static ATTACK_ID = "ddbPactSpellAtk1";

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.ENCHANT;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Bond With Weapon",
      id: InvocationPactOfTheBlade.ACTIVITY_ID,
      activationType: "bonus",
      data: {
        restrictions: {
          type: "weapon",
          categories: ["simpleM", "martialM"],
          allowMagical: true,
        },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Spellcasting Attack",
          type: DDBEnricherData.ACTIVITY_TYPES.ATTACK,
          id: InvocationPactOfTheBlade.ATTACK_ID,
        },
        build: {
          generateAttack: true,
          generateActivation: true,
          generateDamage: false,
          generateRange: false,
          generateTarget: false,
          attackOverride: {
            ability: "spellcasting",
            type: {
              value: "melee",
              classification: "weapon",
            },
          },
          activationOverride: {
            type: "action",
            value: 1,
            condition: "",
          },
        },
        overrides: {
          noConsumeTargets: true,
          data: {
            // a rider on the enchanted weapon: its damage is the weapon's own base damage
            damage: {
              includeBase: true,
              parts: [],
            },
            target: {
              prompt: true,
            },
          },
        },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        type: "enchant",
        name: "Pact Weapon",
        activityMatch: "Bond With Weapon",
        magicalBonus: {
          makeMagical: true,
          nameAddition: "Pact Weapon",
        },
        changes: [
          // DDBEnricherData.ChangeHelper.overrideChange("cha", 20, "system.ability"),
          DDBEnricherData.ChangeHelper.overrideChange("1", 20, "system.proficient"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("foc", 20, "system.properties"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("necrotic", 20, "system.damage.base.types"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("psychic", 20, "system.damage.base.types"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("radiant", 20, "system.damage.base.types"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("necrotic", 20, "system.damage.versatile.types"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("psychic", 20, "system.damage.versatile.types"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("radiant", 20, "system.damage.versatile.types"),
        ],
        options: {
          // the feature text mentions the bonus-action timing; the enchantment itself is permanent
          durationSeconds: null,
          expiry: null,
          description: "This weapon is your pact weapon: you attack with Charisma, you are proficient with it, it is a spellcasting focus, its damage can be necrotic, psychic or radiant, it adds a Cha Based Spellcasting Attack activity.",
        },
        data: {
          _id: InvocationPactOfTheBlade.EFFECT_ID,
          flags: {
            ddbimporter: {
              activityRiders: [InvocationPactOfTheBlade.ATTACK_ID],
              effectRiders: [],
            },
          },
        },
      },
    ];
  }

  override get override(): IDDBOverrideData {
    const flags: IDDBImporterFlags = this.ddbParser.isMuncher
      ? {}
      : {
        transferEnchantment: {
          targetItemMatches: [
            { field: "flags.ddbimporter.dndbeyond.classFeatures", value: "pactWeapon" },
          ],
          effectId: InvocationPactOfTheBlade.EFFECT_ID,
          activityId: InvocationPactOfTheBlade.ACTIVITY_ID,
        },
      };

    return {
      data: {
        flags: {
          ddbimporter: flags,
        },
      },
    };
  }

}
