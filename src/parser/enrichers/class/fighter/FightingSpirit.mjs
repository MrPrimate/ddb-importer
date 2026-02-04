/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class FightingSpirit extends DDBEnricherData {
  get type() {
    return "heal";
  }

  get activity() {
    return {
      data: {
        healing: DDBEnricherData.basicDamagePart({
          customFormula: "@scale.samurai.fighting-spirit",
          types: ["temphp"],
        }),
      },
    };
  }
}
