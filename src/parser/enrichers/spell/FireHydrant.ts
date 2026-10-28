import DDBEnricherData from "../data/DDBEnricherData";
import { ongoingClone } from "./_SpellRegions";

/**
 * Fire Hydrant (OTFY): the stream is a 20-foot Line that saves every creature in it as it is cast,
 * so the parsed Strength save stays the cast and the region fires a free copy when a creature enters
 * the Line for the first time on a turn or ends its turn there. The push to the end of the Line, the
 * Bonus Action redirect (rotate the region by hand) and the hydrant's own AC and Hit Points are left
 * to the table.
 */
export default class FireHydrant extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return {
      name: "Cast",
      id: "ddbFireHydrSave1",
      data: {
        behaviors: [
          DDBEnricherData.BehaviorHelper.activity({
            events: ["tokenEnter", "tokenTurnEnd"],
            activityId: "ddbFireHydrZone1",
          }),
        ],
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [ongoingClone("ddbFireHydrZone1", "Enters the Line for the first time on a turn or ends its turn there: pushed to the end of the Line on a failure")];
  }

}
