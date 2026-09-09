import DDBEnricherData from "../../data/DDBEnricherData";

export default class ManeuverPackLeader extends DDBEnricherData {


  override get builtFeaturesFromActionFilters(): string[] {
    return ["Pack Leader"];
  }

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.ATTACK;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Melee Attack",
      activationType: "reaction",
      activationCondition: "An enemy creature within 5 feet of you is attacked",
      targetType: "creature",
      data: {
        range: {
          units: "ft",
          value: "5",
        },
        description: {
          chatFlavor: "The triggering attack has advantage.",
        },
      },
    };
  }

}
