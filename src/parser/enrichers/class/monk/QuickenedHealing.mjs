/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class QuickenedHealing extends DDBEnricherData {
  get type() {
    return "heal";
  }

  get activity() {
    return {
      type: "heal",
      data: {
        healing: DDBEnricherData.basicDamagePart({
          customFormula: "@scale.monk.martial-arts.die + @prof",
          types: ["healing"],
        }),
      },
    };
  }
}
