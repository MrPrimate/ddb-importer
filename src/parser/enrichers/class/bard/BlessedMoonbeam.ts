import DDBEnricherData from "../../data/DDBEnricherData";

export default class BlessedMoonbeam extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  get activity() {
    return {
      targetType: "creature",
      noeffect: true,
      activationType: "special",
      activationCondition: "A creature fails your moonbeam save",
      data: {
        healing: DDBEnricherData.basicDamagePart({
          number: 2,
          denomination: 4,
          types: ["healing"],
        }),
      },
    };
  }

}
