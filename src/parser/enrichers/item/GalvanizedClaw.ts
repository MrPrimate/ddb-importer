import { utils } from "../../../lib/_module";
import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Galvanized Claw (and DDB's "(Transformed)" copy): a trick weapon whose Transformed state turns
 * your Unarmed Strikes into a 1d8 Slashing claw that can use Strength or Dexterity, with +1 to
 * attack and damage rolls. Transforming is a Bonus Action, so it is an enchantment on the Unarmed
 * Strike (the Demon Armor idiom) rather than a passive bonus. The parser keeps the reaction
 * charges and the lightning and thunder resistances.
 */
export default class GalvanizedClaw extends DDBEnricherData {

  static ACTIVITY_NAME = "Transform: Claw";

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
          id: utils.namedIDStub("galvanizedClaw", { postfix: "core" }),
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
        ],
        options: {
          description: "Your Unarmed Strikes become a 1d8 Slashing claw that can use Strength or Dexterity, with +1 to attack and damage rolls. While you have Temporary Hit Points, melee hits with the claw deal an extra 1d8 Lightning damage.",
        },
      },
    ];
  }

}
