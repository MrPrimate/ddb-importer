import DDBEnricherData from "../data/DDBEnricherData";
import { regionPlacer } from "../data/RegionBuilders";

/**
 * Slamming the maul down turns a circle into swamp for 1 minute: 5 feet of radius for the first
 * charge and 5 more for each extra charge, so the template size follows the charges spent. The
 * wielder crossing the swamp freely has no region equivalent, since difficult terrain is ignored
 * by disposition and never by one token.
 */
export default class QuagmireMaul extends DDBEnricherData {

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      regionPlacer("Slam: Create Swamp", {
        template: { type: "circle", size: "5 * @scaling" },
        range: "5",
        activationCondition: "The wielder crosses the swamp as normal terrain while holding the maul",
        duration: { value: "1", units: "minute" },
        consume: true,
        consumeScalingMax: "@item.uses.value",
        behaviors: [
          DDBEnricherData.BehaviorHelper.difficultTerrain({ types: ["mud"] }),
        ],
      }),
    ];
  }

}
