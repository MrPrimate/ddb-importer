/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class ChannelDivinityPreserveLife extends DDBEnricherData {
  get type() {
    return "heal";
  }

  get activity() {
    return {
      targetType: "ally",
      data: {
        healing: DDBEnricherData.basicDamagePart({
          customFormula: "@classes.cleric.levels * 5",
          types: ["healing"],
        }),
      },
    };
  }
}
