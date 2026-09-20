import DDBEnricherData from "../data/DDBEnricherData";
import { itemActivity, itemUses } from "./_ItemActivities";

export default class GemOfBrightness extends DDBEnricherData {

  override get type(): IDDBActivityType {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get addAutoAdditionalActivities(): boolean {
    return false;
  }

  override get clearAutoEffects(): boolean {
    return true;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "First Command Word",
      activationType: "action",
      noConsumeTargets: true,
      noTemplate: true,
      targetType: "self",
      rangeSelf: true,
      activationCondition:
        "Bright light 30 feet, dim light another 30 feet; remove the Gem Light effect when using another function or the extinguish command",
    };
  }

  override get override(): IDDBOverrideData {
    return itemUses(this, "50");
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    const save = { ability: ["con"], dc: { calculation: "", formula: "15" } };
    return [
      itemActivity("Second Command Word", DDBEnricherData.ACTIVITY_TYPES.SAVE, {
        activationType: "action",
        addItemConsume: true,
        noeffect: false,
        targetType: "creature",
        targetCount: "1",
        rangeType: "ft",
        rangeValue: 60,
        overrideRange: true,
        activationCondition: "Target repeats the save at each turn end, ending Blindness on success",
        data: { save },
      }),
      itemActivity("Third Command Word", DDBEnricherData.ACTIVITY_TYPES.SAVE, {
        activationType: "action",
        addItemConsume: true,
        itemConsumeValue: "5",
        noeffect: false,
        noTemplate: false,
        overrideTarget: true,
        activationCondition: "Targets repeat the save at each turn end, ending Blindness on success",
        data: {
          save,
          target: { affects: { type: "creature", count: "" }, template: { type: "cone", size: "30", units: "ft" } },
        },
      }),
      itemActivity("Extinguish Light", DDBEnricherData.ACTIVITY_TYPES.UTILITY, {
        activationType: "bonus",
        activationCondition: "Remove the Gem Light effect",
      }),
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Gem Light",
        activityMatch: "First Command Word",
        options: { transfer: false, durationSeconds: null },
        atlChanges: [
          DDBEnricherData.ChangeHelper.atlChange("ATL.light.bright", CONST.ACTIVE_EFFECT_MODES.UPGRADE, "30"),
          DDBEnricherData.ChangeHelper.atlChange("ATL.light.dim", CONST.ACTIVE_EFFECT_MODES.UPGRADE, "60"),
        ],
      },
      {
        name: "Beam Blindness",
        statuses: ["Blinded"],
        options: { transfer: false, expiry: null, durationSeconds: 60 },
        activityMatch: "Second Command Word",
      },
      {
        name: "Flare Blindness",
        statuses: ["Blinded"],
        options: { transfer: false, expiry: null, durationSeconds: 60 },
        activityMatch: "Third Command Word",
      },
    ];
  }

}
