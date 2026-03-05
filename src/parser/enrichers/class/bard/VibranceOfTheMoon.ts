import DDBEnricherData from "../../data/DDBEnricherData";

export default class VibranceOfTheMoon extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  get activity(): IDDBActivityData {
    return {
      targetType: "creature",
      noeffect: true,
      activationType: "special",
      data: {
        healing: DDBEnricherData.basicDamagePart({
          number: 1,
          denomination: 6,
          types: ["healing"],
        }),
      },
    };
  }

}
