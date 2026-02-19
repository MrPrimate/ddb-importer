/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class ChannelDivinityTurnTheTide extends DDBEnricherData {

  get type() {
    return "heal";
  }

  get activity() {
    return {
      targetType: "ally",
      condition: "Reduced to half HP",
      data: {
        healing: DDBEnricherData.basicDamagePart({
          number: 1,
          denomination: 6,
          bonus: "max(@abilities.cha.mod, 1)",
          types: ["healing"],
        }),
      },
    };
  }

}
