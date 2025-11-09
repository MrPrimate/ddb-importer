/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class BlessedMoonbeam extends DDBEnricherData {

  get type() {
    return "heal";
  }

  get activity() {
    return {
      targetType: "creature",
      noeffect: true,
      activationType: "special",
      activationCondition: "A creature fails your moonbeam save",
      data: {
        healing: DDBEnricherData.basicDamagePart({
          number: "2",
          denomination: "4",
          types: ["healing"],
        }),
      },
    };
  }

}
