import DDBEnricherData from "../../data/DDBEnricherData";
import { areaPlacer } from "../../data/AreaBuilders";

/**
 * DDB sets the two effects this feature grants as bold-only paragraphs under it, so they are
 * options of one feature. The parser builds Rising Whirlwind's save; Vortex Terrain rolls
 * nothing, so it left no activity. It is an aura: for a minute the area within 20 feet of the
 * Elemental is difficult terrain for its enemies. Either option is the one daily use.
 */
export default class ConvocationOfAir extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return {
      name: "Rising Whirlwind",
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      areaPlacer("Vortex Terrain", {
        template: { type: "radius", size: "20" },
        affects: "enemy",
        activationType: "bonus",
        activationCondition: "For 1 minute the area within 20 feet is difficult terrain for enemies",
        duration: { value: "1", units: "minute" },
        consume: true,
      }),
    ];
  }

  // the placer sits beside the parsed save, not instead of it
  override get keepParsedActivities(): boolean {
    return true;
  }

}
