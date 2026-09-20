import DDBEnricherData from "../data/DDBEnricherData";
import { itemActivity, itemUses } from "./_ItemActivities";

export default class IronBandsOfBilarro extends DDBEnricherData {

  override get type(): IDDBActivityType {
    return DDBEnricherData.ACTIVITY_TYPES.ATTACK;
  }

  override get addAutoAdditionalActivities(): boolean {
    return false;
  }

  override get clearAutoEffects(): boolean {
    return true;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Throw Bands",
      activationType: "action",
      activationCondition: "One Huge or smaller creature you can see",
      addItemConsume: true,
      rangeType: "ft",
      rangeValue: 60,
      overrideRange: true,
      targetType: "creature",
      targetCount: "1",
      noTemplate: true,
      flatAttack: "@abilities.dex.mod + @prof",
      data: {
        attack: { type: { value: "ranged", classification: "weapon" } },
        damage: { includeBase: false, parts: [] },
      },
    };
  }

  override get override(): IDDBOverrideData {
    return itemUses(this, "1", [{ period: "dawn", type: "recoverAll" }]);
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      itemActivity("Release Bands", DDBEnricherData.ACTIVITY_TYPES.UTILITY, {
        activationType: "bonus",
        targetType: "creature",
        targetCount: "1",
        activationCondition: "Release the restrained creature manually",
      }),
      itemActivity("Escape Check", DDBEnricherData.ACTIVITY_TYPES.CHECK, {
        activationType: "action",
        rangeType: "touch",
        targetType: "creature",
        targetCount: "1",
        activationCondition:
          "On success, destroy the bands and free the creature. On failure, this creature cannot retry for 24 hours.",
        data: {
          check: { ability: "str", associated: this.is2014 ? [] : ["ath"], dc: { calculation: "", formula: "20" } },
        },
      }),
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Iron Bands",
        statuses: ["Restrained"],
        activityMatch: "Throw Bands",
        options: { transfer: false, durationSeconds: null, expiry: null },
      },
    ];
  }

}
