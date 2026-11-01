import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Neko Duelist (OTFY). The Climb Speed comes from DDB's modifier effect. Nine Lives is Second Wind
 * used with no action when reduced to 0 Hit Points, so it heals as Second Wind and spends its use.
 */
export default class FelineNature extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Nine Lives",
      activationType: "special",
      activationCondition: "You are reduced to 0 Hit Points but not killed outright",
      targetType: "self",
      additionalConsumptionTargets: [
        {
          type: "itemUses",
          target: "second-wind",
          value: "1",
          scaling: { mode: "", formula: "" },
        },
      ],
      data: {
        healing: DDBEnricherData.basicDamagePart({
          number: 1,
          denomination: 10,
          bonus: "@classes.fighter.levels",
          types: ["healing"],
        }),
      },
    };
  }

}
