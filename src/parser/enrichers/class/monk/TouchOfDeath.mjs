/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class TouchOfDeath extends DDBEnricherData {
  get type() {
    return "heal";
  }

  get activity() {
    return {
      data: {
        healing: DDBEnricherData.basicDamagePart({
          customFormula: "min(@abilities.wis.mod + @classes.monk.levels, 1)",
          types: ["temphp"],
        }),
      },
    };
  }

}
