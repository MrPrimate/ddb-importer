import DDBEnricherData from "../../data/DDBEnricherData";
import { regionPlacer } from "../../data/RegionBuilders";
import _Illrigger from "./_Illrigger";

/**
 * DDB's three boon actions are kept, with By the Throat and Dispater's Supremacy hidden until
 * the illrigger reaches 13th and 18th level. Telekinetic Seal answers a creature moving within
 * 5 feet, so a 5-foot emanation offers DDB's own Wisdom save to an enemy that enters it; spending
 * the Reaction and choosing between the push and Prone stay with the illrigger.
 */
export default class DispatersInterdiction extends _Illrigger {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.NONE;
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      { action: { name: "Telekinetic Seal", type: "class" } },
      {
        action: { name: "By the Throat", type: "class" },
        overrides: { data: _Illrigger.boonVisibility(13) },
      },
      {
        action: { name: "Dispater's Supremacy (Passive)", type: "class" },
        overrides: { data: _Illrigger.boonVisibility(18) },
      },
      regionPlacer("Telekinetic Seal: Place Aura", {
        template: { type: "radius", size: "5" },
        affects: "enemy",
        activationType: "special",
        behaviors: [
          DDBEnricherData.BehaviorHelper.activity({
            events: ["tokenEnter"],
            enterOn: "movement",
            activityName: "Telekinetic Seal",
            excludeSelf: true,
          }),
        ],
      }),
    ];
  }

}
