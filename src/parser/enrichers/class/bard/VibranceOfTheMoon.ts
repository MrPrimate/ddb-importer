import DDBEnricherData from "../../data/DDBEnricherData";

export default class VibranceOfTheMoon extends DDBEnricherData {

  get type() {
    return "heal";
  }

  get activity() {
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
