import DDBEnricherData from "../data/DDBEnricherData";
import { itemUses } from "./_ItemActivities";

/**
 * The parser's bonus action is planting the shield. The metal roots are a charge spent on a
 * 10-foot emanation from the planted shield, so the area stays where it was placed; it is
 * difficult terrain for enemies only, which stays a note on the activity. DDB carries no charges
 * for the shield.
 */
export default class ShieldOfYggdrasil extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Shield Plant",
      targetType: "self",
      activationType: "bonus",
      activationCondition: "A Magic action instead lets you doff the shield and leave it standing",
      noConsumeTargets: true,
      noTemplate: true,
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: { name: "Metal Roots", type: DDBEnricherData.ACTIVITY_TYPES.UTILITY },
        build: {
          generateSave: false,
          generateDamage: false,
          generateActivation: true,
          generateTarget: true,
          generateRange: true,
          generateDuration: false,
          generateConsumption: false,
          activationOverride: {
            type: "bonus",
            value: null,
            condition: "When you plant the shield, or on a later turn while it is planted; difficult terrain for your enemies",
          },
          targetOverride: {
            override: true,
            affects: { type: "enemy" },
            template: { contiguous: false, units: "ft", type: "radius", size: "10" },
          },
          rangeOverride: { override: true, value: null, units: "self", special: "" },
        },
        overrides: {
          addItemConsume: true,
          noeffect: true,
        },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Shield Planted",
        activityMatch: "Shield Plant",
        changes: [
          DDBEnricherData.ChangeHelper.overrideChange("5", 60, "system.attributes.movement.walk"),
        ],
        options: {
          transfer: false,
          description: "Speed 5 feet, Half Cover against ranged attacks from the direction you face, and Bludgeoning, Piercing and Slashing damage from weapons and Unarmed Strikes is reduced by 3.",
        },
      },
    ];
  }

  override get override(): IDDBOverrideData {
    return itemUses(this, "3", [{ period: "dawn", type: "recoverAll" }]);
  }

}
