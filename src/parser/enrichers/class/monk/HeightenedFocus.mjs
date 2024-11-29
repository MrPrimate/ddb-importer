/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class HeightenedFocus extends DDBEnricherData {
  get type() {
    return "heal";
  }

  get activity() {
    return {
      name: "Patient Defense Healing",
      data: {
        healing: DDBEnricherData.basicDamagePart({
          customFormula: "2@scale.monk.martial-arts.die",
          types: ["temphp"],
        }),
      },
    };
  }

  get clearAutoEffects() {
    return true;
  }
}
