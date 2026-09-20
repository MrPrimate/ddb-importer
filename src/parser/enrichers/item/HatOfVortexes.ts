import DDBEnricherData from "../data/DDBEnricherData";
import { regionPlacerData } from "../data/RegionBuilders";

/** A charge releases a 10-foot cube of vortex from the holder that is difficult terrain for 1 hour. */
export default class HatOfVortexes extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return regionPlacerData("Release Vortex", {
      template: { type: "cube", size: "10" },
      duration: { value: "1", units: "hour" },
      consume: true,
      behaviors: [
        DDBEnricherData.BehaviorHelper.difficultTerrain(),
      ],
    });
  }

}
