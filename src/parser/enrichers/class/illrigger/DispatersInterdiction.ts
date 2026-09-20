import DDBEnricherData from "../../data/DDBEnricherData";
import { regionPlacer } from "../../data/RegionBuilders";

/**
 * DDB's actions are kept as they are. Telekinetic Seal answers a creature moving within 5 feet,
 * so a 5-foot emanation offers DDB's own Wisdom save to an enemy that enters it; spending the
 * Reaction and choosing between the push and Prone stay with the illrigger.
 */
export default class DispatersInterdiction extends DDBEnricherData {

  override get useDefaultAdditionalActivities(): boolean {
    return true;
  }

  override get addToDefaultAdditionalActivities(): boolean {
    return true;
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      regionPlacer("Telekinetic Seal: Place Aura", {
        template: { type: "radius", size: "5" },
        affects: "enemy",
        activationType: "special",
        behaviors: [
          DDBEnricherData.BehaviorHelper.activity({
            events: ["tokenEnter"],
            activityName: "Telekinetic Seal",
            excludeSelf: true,
          }),
        ],
      }),
    ];
  }

}
