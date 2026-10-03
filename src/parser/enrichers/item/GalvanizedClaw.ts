import { utils } from "../../../lib/_module";
import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Galvanized Claw: a trick weapon whose Transformed state turns your Unarmed Strikes into a 1d8
 * Slashing claw that can use Strength or Dexterity, with +1 to attack and damage rolls.
 * Transforming is a Bonus Action, so it is an enchantment on the Unarmed Strike (the Demon Armor
 * idiom) rather than a passive bonus. The parser keeps the reaction charges and the lightning and
 * thunder resistances.
 *
 * DDB also ships the two states as their own items, "Galvanized Claw (Transformed)" and
 * "(Untransformed)", which it types as ammunition. Those import as weapons (the claw has no attack
 * of its own, the enchanted Unarmed Strike is the attack). On a character import they are named
 * "Galvanized Claw" - a character keeps only one copy (STATE_COPIES in
 * parser/character/inventory.ts) - and the Transformed copy carries a transfer flag so the
 * Unarmed Strike is enchanted straight away while the claw is equipped and attuned. Munched
 * copies keep DDB's names: the compendium matches items by name, type and ruleset, so two weapons
 * both named "Galvanized Claw" would collapse into one.
 */
export default class GalvanizedClaw extends DDBEnricherData {

  static ACTIVITY_NAME = "Transform: Claw";

  static ACTIVITY_ID = utils.namedIDStub("galvanizedClaw", { postfix: "core" });

  static EFFECT_ID = utils.namedIDStub("galvanizedClaw", { prefix: "enchant", postfix: "ef" });

  /** Roll-time condition: the wielder has Temporary Hit Points. */
  static HAS_TEMP_HP: IEffectChangeFilter = { k: "attributes.hp.temp", o: "gt", v: 0 };

  /** DDB's per-state copy, "(Transformed)" or "(Untransformed)", as opposed to the base item. */
  get isStateCopy(): boolean {
    return (/\((?:un)?transformed\)$/i).test(this.name ?? "");
  }

  get isTransformedCopy(): boolean {
    return (this.name ?? "").endsWith("(Transformed)");
  }

  override get documentStub(): IDDBDocumentStub | null {
    if (!this.isStateCopy) return null;
    return {
      // a weapon document, but parsed as the wondrous item DDB describes so no weapon attack is built
      documentType: "weapon",
      parsingType: "wondrous",
      systemType: {
        value: "simpleM",
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: GalvanizedClaw.ACTIVITY_NAME,
          type: DDBEnricherData.ACTIVITY_TYPES.ENCHANT,
        },
        build: {
          generateTarget: false,
          generateRange: false,
          generateConsumption: false,
          generateActivation: true,
          activationOverride: { type: "bonus", value: 1, condition: "" },
        },
        overrides: {
          id: GalvanizedClaw.ACTIVITY_ID,
          noConsumeTargets: true,
          data: {
            restrictions: {
              type: "weapon",
              categories: ["natural"],
              allowMagical: true,
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
        name: "Galvanized Claw (Transformed)",
        activityMatch: GalvanizedClaw.ACTIVITY_NAME,
        magicalBonus: {
          bonus: "1",
          makeMagical: true,
          nameAddition: "Galvanized Claw",
        },
        changes: [
          DDBEnricherData.ChangeHelper.overrideChange("1", 20, "system.damage.base.number"),
          DDBEnricherData.ChangeHelper.overrideChange("8", 20, "system.damage.base.denomination"),
          DDBEnricherData.ChangeHelper.overrideChange("false", 20, "system.damage.base.custom.enabled"),
          // a Set change removes an entry when the value is prefixed with "-"
          DDBEnricherData.ChangeHelper.addChange("slashing", 20, "system.damage.base.types"),
          DDBEnricherData.ChangeHelper.addChange("-bludgeoning", 21, "system.damage.base.types"),
          // Strength or Dexterity
          DDBEnricherData.ChangeHelper.unsignedAddChange("fin", 20, "system.properties"),
          // A rule on the enchantment lands in the Unarmed Strike's own applied rules, so it only joins
          // the claw's damage rolls. dnd5e appends a rule bonus to an existing damage part; the flavor
          // splits it off as its own lightning chunk when the rolls are aggregated.
          DDBEnricherData.ChangeHelper.ruleBonusChange("damage", "1d8[lightning]", {
            conditions: GalvanizedClaw.HAS_TEMP_HP,
          }),
        ],
        options: {
          description: "Your Unarmed Strikes become a 1d8 Slashing claw that can use Strength or Dexterity, with +1 to attack and damage rolls, and an extra 1d8 Lightning damage while you have Temporary Hit Points.",
        },
        data: {
          _id: GalvanizedClaw.EFFECT_ID,
        },
      },
    ];
  }

  override get override(): IDDBOverrideData | null {
    if (!this.isStateCopy) return null;
    // linkSelectedEnchantments only transfers while the claw is equipped and attuned
    const flags: IDDBImporterFlags = this.isTransformedCopy && !this.ddbParser.isMuncher
      ? {
        transferEnchantment: {
          targetItemMatches: [
            { field: "type", value: "weapon" },
            { field: "system.type.value", value: "natural" },
          ],
          effectId: GalvanizedClaw.EFFECT_ID,
          activityId: GalvanizedClaw.ACTIVITY_ID,
        },
      }
      : {};

    return {
      data: {
        ...(this.ddbParser.isMuncher ? {} : { name: "Galvanized Claw" }),
        system: {
          // DDB's ammunition typing leaves "ammunition" as the base item; the stub cannot clear it
          type: { value: "simpleM", baseItem: "" },
        },
        flags: {
          ddbimporter: flags,
        },
      },
    };
  }

}
