import DDBEnricherData from "../data/DDBEnricherData";
import { ongoingClone } from "./_SpellRegions";

/**
 * The bears roll their save against each enemy as the cube appears, then again for one that
 * enters it or ends its turn there. Moving the cube 40 feet is a Bonus Action that means dragging
 * the region, and the save it forces on creatures it moves onto is rolled by hand.
 */
export default class Bearstormer extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return {
      id: "ddbBearstormSpSv",
      targetType: "enemy",
      data: {
        behaviors: [
          DDBEnricherData.BehaviorHelper.activity({
            events: ["tokenEnter", "tokenTurnEnd"],
            activityId: "ddbBearstormZon1",
          }),
        ],
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      ongoingClone("ddbBearstormZon1", "An enemy enters the cube or ends its turn there, or the cube moves into its space (once per turn)"),
    ];
  }

  override get clearAutoEffects(): boolean {
    return true;
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        // unmatched, so both the cast and its ongoing copy carry it
        name: "Frightened",
        statuses: ["Frightened"],
        options: { transfer: false, expiry: "targetEnd", description: "Frightened until the end of its next turn." },
      },
    ];
  }

}
