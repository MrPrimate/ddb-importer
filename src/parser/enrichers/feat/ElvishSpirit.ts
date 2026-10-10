import DDBEnricherData from "../data/DDBEnricherData";

/**
 * The One Ring virtue: four hours of meditation restore all lost hit points and remove one level of
 * exhaustion (an exhaustion consumption target), once per long rest.
 */
export default class ElvishSpirit extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Meditate",
      targetType: "self",
      activationType: "hour",
      activationCondition: "Meditate for 4 hours; not if you had a long rest within the last 24 hours or have 0 hit points",
      addItemConsume: true,
      additionalConsumptionTargets: [
        {
          type: "attribute",
          value: "1",
          target: "attributes.exhaustion",
          scaling: { mode: "", formula: "" },
        },
      ],
      data: {
        healing: DDBEnricherData.basicDamagePart({ customFormula: "@attributes.hp.max - @attributes.hp.value", types: ["healing"] }),
      },
    };
  }

}
