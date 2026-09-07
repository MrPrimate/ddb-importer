import DDBEnricherData from "../data/DDBEnricherData";

export default class ReweaveFate extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Reroll and Temp HP",
      targetType: "creature",
      data: {
        healing: DDBEnricherData.basicDamagePart({ number: 6, denomination: 10, types: ["temphp"], scalingMode: "none" }),
      },
    };
  }

}
