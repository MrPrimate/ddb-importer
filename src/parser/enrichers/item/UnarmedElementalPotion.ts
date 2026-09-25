import { utils } from "../../../lib/_module";
import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Potions that, for an hour, let an Unarmed Strike "deal your choice of X damage or its normal
 * damage type". That is an extra option on the strike rather than a bonus to it, so it is an
 * enchantment adding to `system.damage.base.types` - the Sacred Weapon idiom - and dnd5e offers
 * the choice at roll time.
 *
 * The enchantment is an additional activity so the potion keeps the drink activity that rolls its
 * self damage, and the parser's consumable effect that grants the resistance.
 */
export default class UnarmedElementalPotion extends DDBEnricherData {

  static DAMAGE_TYPE: Record<string, string> = {
    "salamander sauce": "fire",
    "last rites rum": "necrotic",
  };

  get damageType(): string {
    return UnarmedElementalPotion.DAMAGE_TYPE[utils.nameString(this.name).toLowerCase()] ?? "fire";
  }

  get activityName(): string {
    return `Empower Unarmed Strikes (${utils.capitalize(this.damageType)})`;
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: this.activityName,
          type: DDBEnricherData.ACTIVITY_TYPES.ENCHANT,
        },
        build: {
          generateTarget: false,
          generateRange: false,
          generateConsumption: false,
        },
        overrides: {
          // part of drinking the potion, not a second action
          activationType: "special",
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
    const damageType = this.damageType;
    return [
      {
        type: "enchant",
        name: this.activityName,
        activityMatch: this.activityName,
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange(damageType, 20, "system.damage.base.types"),
        ],
        options: {
          durationSeconds: 3600,
          description: `Your Unarmed Strike can deal ${utils.capitalize(damageType)} damage or its normal damage type.`,
        },
      },
    ];
  }

}
