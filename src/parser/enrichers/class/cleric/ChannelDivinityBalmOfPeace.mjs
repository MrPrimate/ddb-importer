/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class ChannelDivinityBalmOfPeace extends DDBEnricherData {
  get type() {
    return "heal";
  }

  get activity() {
    return {
      name: "Healing Roll",
      targetType: "ally",
      data: {
        healing: DDBEnricherData.basicDamagePart({
          number: 2,
          denomination: 6,
          bonus: "@abilities.wis.mod",
          types: ["healing"],
        }),
      },
    };
  }
}
