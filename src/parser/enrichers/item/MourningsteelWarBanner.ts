import DDBEnricherData from "../data/DDBEnricherData";
import { itemActivity } from "./_ItemActivities";
import { regionPlacerData } from "./_ItemRegions";

/**
 * Planting the standard costs nothing and makes its own 5-foot space difficult terrain until it
 * is pulled up. The charges only pay for the animated armors it can call as it is planted, one
 * per charge, which are placed by hand.
 */
export default class MourningsteelWarBanner extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return regionPlacerData("Plant the Standard", {
      template: { type: "square", size: "5" },
      range: "5",
      activationCondition: "An unoccupied space within your reach; removing it by force is a DC 25 Strength (Athletics) check",
      duration: { units: "perm" },
      behaviors: [
        DDBEnricherData.BehaviorHelper.difficultTerrain(),
      ],
    });
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      itemActivity("Summon Animated Armor", DDBEnricherData.ACTIVITY_TYPES.UTILITY, {
        activationCondition: "As part of planting the standard: one Animated Armor per charge, within 20 feet of it, for 1 hour",
        noConsumeTargets: false,
        addItemConsume: true,
        addScalingMode: "amount",
        addConsumptionScalingMax: "@item.uses.value",
      }),
    ];
  }

}
