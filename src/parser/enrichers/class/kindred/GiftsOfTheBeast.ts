import DDBEnricherData from "../../data/DDBEnricherData";
import { riders, toggleOffChanges } from "../../data/SelfEnchant";

/**
 * Kindred (Gifts of the Beast): a bonus action and 1 Blood Point grow claws for a minute; Unarmed
 * Strikes deal 2d6 slashing and can use Dexterity. Growing them is a self-enchantment whose riders
 * are the reminder effect and Rending Claws, so the claw attack only appears while it lasts.
 */
export default class GiftsOfTheBeast extends DDBEnricherData {

  static CLAWS_ID = "ddbFeralWeaponRC";

  static EFFECT_ID = "ddbFeralWeaponEf";

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.ENCHANT;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Feral Weapons",
      targetType: "self",
      noTemplate: true,
      activationType: "bonus",
      addItemConsume: true,
      itemConsumeTargetName: "feat:blood-potency",
      itemConsumeValue: "1",
      data: {
        duration: { value: "1", units: "minute" },
        enchant: {
          self: true,
        },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: { name: "Rending Claws", type: DDBEnricherData.ACTIVITY_TYPES.ATTACK },
        build: {
          generateConsumption: false,
          generateTarget: true,
          generateActivation: true,
          generateAttack: true,
          generateDamage: true,
          activationOverride: { type: "action", value: 1, condition: "While Feral Weapons is active" },
          damageParts: [DDBEnricherData.basicDamagePart({ number: 2, denomination: 6, bonus: "@mod", types: ["slashing"] })],
        },
        overrides: {
          id: GiftsOfTheBeast.CLAWS_ID,
          targetType: "creature",
          noConsumeTargets: true,
          data: {
            attack: { ability: "dex", type: { value: "melee", classification: "unarmed" } },
            range: { units: "ft", value: "5" },
          },
        },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Feral Weapons",
        options: { transfer: true, durationSeconds: 60, description: "Unarmed Strikes deal 2d6 Slashing damage and can use Dexterity instead of Strength." },
        data: {
          _id: GiftsOfTheBeast.EFFECT_ID,
        },
      },
      {
        name: "Feral Weapons",
        type: "enchant",
        activityMatch: "Feral Weapons",
        changes: toggleOffChanges("Retract Claws"),
        data: {
          flags: {
            ddbimporter: riders({ activities: [GiftsOfTheBeast.CLAWS_ID], effects: [GiftsOfTheBeast.EFFECT_ID] }),
          },
        },
      },
    ];
  }

}
