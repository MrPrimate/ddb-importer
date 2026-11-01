import DDBEnricherData from "../data/DDBEnricherData";
import { ongoingClone } from "./_SpellAreas";

/**
 * Fire Hydrant (OTFY): the stream is a 20-foot Line that saves every creature in it as it is cast,
 * so the parsed Strength save stays the cast and a free copy is used by hand when a creature enters
 * the Line for the first time on a turn or ends its turn there. The push to the end of the Line,
 * the Bonus Action redirect and the hydrant's own AC and Hit Points are left to the table.
 */
export default class FireHydrant extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return {
      name: "Cast",
      id: "ddbFireHydrSave1",
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [ongoingClone("ddbFireHydrZone1", "Enters the Line for the first time on a turn or ends its turn there: pushed to the end of the Line on a failure")];
  }

}
