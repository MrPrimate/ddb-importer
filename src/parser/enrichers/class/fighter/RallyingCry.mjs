/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class RallyingCry extends DDBEnricherData {
  get type() {
    return "heal";
  }

  get activity() {
    return {
      name: "Heroic Rally",
      targetType: "creature",
      data: {
        healing: DDBEnricherData.basicDamagePart({
          customFormula: "@classes.fighter.level",
          types: ["healing"],
        }),
      },
    };
  }

}
