import DDBEnricherData from "../data/DDBEnricherData";
import { regionPlacer } from "./_ItemRegions";

/**
 * A charge covers a 20-foot square in briars. They are ordinary plants once grown, so the area is
 * permanent difficult terrain until someone clears it.
 */
export default class StaffOfBriars extends DDBEnricherData {

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      regionPlacer("Sprout Briars", {
        template: { type: "square", size: "20" },
        range: "5",
        duration: { units: "perm" },
        consume: true,
        behaviors: [
          DDBEnricherData.BehaviorHelper.difficultTerrain({ types: ["plants"] }),
        ],
      }),
    ];
  }

}
