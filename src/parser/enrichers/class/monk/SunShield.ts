import DDBEnricherData from "../../data/DDBEnricherData";
import { riders, toggleOffChanges } from "../../data/SelfEnchant";

/**
 * The light is a self-enchantment toggle whose riders are the light effect and the reaction
 * damage, so the reaction only appears while the light is on.
 */
export default class SunShield extends DDBEnricherData {

  static REACTION_ID = "ddbSunShieldReDm";

  static EFFECT_ID = "ddbSunShieldLght";

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.ENCHANT;
  }

  override get activity(): IDDBActivityData {
    return {
      noTemplate: true,
      targetType: "self",
      name: "Toggle Light/Aura",
      data: {
        enchant: {
          self: true,
        },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Reaction Damage",
          type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE,
        },
        build: {
          generateDamage: true,
          generateTarget: true,
          damageParts: [
            DDBEnricherData.basicDamagePart({
              customFormula: "5 + @abilities.wis.mod",
              types: ["radiant"],
            }),
          ],
        },
        overrides: {
          id: SunShield.REACTION_ID,
          noTemplate: true,
          activationType: "reaction",
        },
      },
    ];
  }


  override get effects(): IDDBEffectHint[] {
    return [{
      name: `Sun Shield Aura`,
      options: {
        transfer: true,
      },
      data: {
        _id: SunShield.EFFECT_ID,
      },
      changes: [
        DDBEnricherData.ChangeHelper.upgradeChange("30", 20, "token.light.bright"),
        DDBEnricherData.ChangeHelper.upgradeChange("60", 20, "token.light.dim"),
        DDBEnricherData.ChangeHelper.overrideChange("#ffffff", 20, "token.light.color"),
        DDBEnricherData.ChangeHelper.overrideChange("0.25", 20, "token.light.alpha"),
      ],
    }, {
      name: "Sun Shield",
      type: "enchant",
      activityMatch: "Toggle Light/Aura",
      changes: toggleOffChanges("Douse Light/Aura"),
      data: {
        flags: {
          ddbimporter: riders({ activities: [SunShield.REACTION_ID], effects: [SunShield.EFFECT_ID] }),
        },
      },
    }];

  }


}
