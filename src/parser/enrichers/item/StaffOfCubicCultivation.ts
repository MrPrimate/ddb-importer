import DDBEnricherData from "../data/DDBEnricherData";
import { regionPlacer } from "./_ItemRegions";

/**
 * Each charge spent raises one 5-foot cube of gelatinous material for 1 minute, so the template
 * count follows the charges. The cubes are objects that can be climbed and walked on, and their
 * sticky surfaces are difficult terrain.
 */
export default class StaffOfCubicCultivation extends DDBEnricherData {

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      regionPlacer("Create Cubes", {
        template: { type: "cube", size: "5", count: "@scaling" },
        range: "5",
        activationCondition: "Each cube is an object with AC 10, 20 Hit Points and Resistance to Acid damage",
        duration: { value: "1", units: "minute" },
        consume: true,
        consumeScalingMax: "@item.uses.value",
        behaviors: [
          DDBEnricherData.BehaviorHelper.difficultTerrain(),
        ],
      }),
    ];
  }

}
