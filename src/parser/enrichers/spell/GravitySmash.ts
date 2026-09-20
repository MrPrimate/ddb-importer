import DDBEnricherData from "../data/DDBEnricherData";
import { ongoingTrigger } from "./_SpellRegions";

/**
 * The cylinder is difficult terrain for the round the spell lasts, and the save comes when it
 * ends, not when it is cast: the full damage if it ran its course, the lesser if it ended early.
 * DDB carries both as parts of one roll, so the cast keeps the first and the early collapse is a
 * free save with the second.
 */
export default class GravitySmash extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return {
      name: "Cast",
      activationCondition: "The save is made when the spell ends at the start of your next turn",
      removeDamageParts: true,
      damageParts: [
        DDBEnricherData.basicDamagePart({ number: 8, denomination: 10, types: ["force"], scalingMode: "whole", scalingNumber: 1 }),
      ],
      data: {
        behaviors: [
          DDBEnricherData.BehaviorHelper.difficultTerrain(),
        ],
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      ongoingTrigger({
        name: "Early Collapse Save",
        condition: "The spell ends before the start of your next turn; each creature in the cylinder",
        damageParts: [1],
      }),
    ];
  }

}
