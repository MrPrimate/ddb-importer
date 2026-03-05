import DDBEnricherData from "../../data/DDBEnricherData";

export default class HuntersRime extends DDBEnricherData {
  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  get activity(): IDDBActivityData {
    return {
      targetType: "self",
      data: {
        healing: DDBEnricherData.basicDamagePart({
          number: 1,
          denomination: 10,
          types: ["temphp"],
        }),
      },
    };
  }

}
