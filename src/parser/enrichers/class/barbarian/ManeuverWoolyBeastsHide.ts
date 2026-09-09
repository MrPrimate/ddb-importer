import DDBEnricherData from "../../data/DDBEnricherData";

export default class ManeuverWoolyBeastsHide extends DDBEnricherData {


  override get builtFeaturesFromActionFilters(): string[] {
    return ["Wooly Beast's Hide: Reduce Damage"];
  }

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Reduce Damage",
      activationType: "reaction",
      activationCondition: "You are hit by an attack",
      targetType: "self",
      noConsumeTargets: true,
      addItemConsume: true,
      itemConsumeTargetName: "maneuver-points",
      itemConsumeValue: 2,
      addScalingMode: "amount",
      addScalingFormula: "2",
      addConsumptionScalingMax: "10",
      data: {
        roll: {
          formula: "(1 + @scaling)d6",
          name: "Damage Reduction",
          visible: true,
        },
        description: {
          chatFlavor: "Reduce the damage by the result, then gain temporary hit points equal to the result.",
        },
      },
    };
  }

}
