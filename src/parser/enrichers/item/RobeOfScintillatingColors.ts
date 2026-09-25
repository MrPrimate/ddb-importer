import DDBEnricherData from "../data/DDBEnricherData";
import { itemActivity, itemUses } from "./_ItemActivities";

export default class RobeOfScintillatingColors extends DDBEnricherData {

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
      name: "Display Dazzling Hues",
      activationType: "action",
      addItemConsume: true,
      rangeSelf: true,
      overrideTarget: true,
      activationCondition:
        "Until your next turn ends: bright light 30 feet, dim light another 30 feet; sighted attackers have disadvantage",
      data: { target: { affects: { type: "self", count: "" }, template: { type: "radius", size: "30", units: "ft" } } },
    };
  }

  override get override(): IDDBOverrideData {
    return itemUses(this, "3", [{ period: "dawn", type: "formula", formula: "1d3" }]);
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      itemActivity("Dazzling Hues Save", DDBEnricherData.ACTIVITY_TYPES.SAVE, {
        noeffect: false,
        targetType: "creature",
        rangeType: "ft",
        rangeValue: 30,
        overrideRange: true,
        activationCondition: "When the robe is activated, for creatures in its bright light that can see you",
        data: { save: { ability: ["wis"], dc: { calculation: "", formula: "15" } } },
      }),
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Scintillating Light",
        activityMatch: "Display Dazzling Hues",
        options: { transfer: false, durationSeconds: null, expiry: "sourceEnd" },
        tokenChanges: [
          DDBEnricherData.ChangeHelper.upgradeChange(30, 20, "token.light.bright"),
          DDBEnricherData.ChangeHelper.upgradeChange(60, 20, "token.light.dim"),
        ],
      },
      {
        name: "Dazzled",
        statuses: ["Stunned"],
        activityMatch: "Dazzling Hues Save",
        options: { transfer: false, expiry: "sourceEnd", durationSeconds: null },
      },
    ];
  }

}
