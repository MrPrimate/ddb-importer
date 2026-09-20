import DDBEnricherData from "../data/DDBEnricherData";
import { itemUses } from "./_ItemActivities";

/**
 * Vanisher Hat: once per dawn, an action to become Invisible with a 40 foot fly speed for up to 1 minute.
 */
export default class VanisherHat extends DDBEnricherData {
  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Speak Command Word",
      activationType: "action",
      targetType: "self",
      rangeSelf: true,
      addItemConsume: true,
    };
  }

  override get override(): IDDBOverrideData {
    return itemUses(this, "1", [{ period: "dawn", type: "recoverAll" }]);
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Vanished",
        statuses: ["Invisible"],
        options: {
          transfer: false,
          durationSeconds: 60,
          description: "Ends if you repeat the command word as an action, or when you attack or cast a spell.",
        },
        changes: [
          DDBEnricherData.ChangeHelper.upgradeChange(40, 20, "system.attributes.movement.fly"),
        ],
      },
    ];
  }

}
