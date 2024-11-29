/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class ImprovedBlessedStrikesPotentSpellcasting extends DDBEnricherData {
  get type() {
    return "heal";
  }

  get activity() {
    return {
      targetType: "creature",
      activationType: "special",
      data: {
        healing: DDBEnricherData.basicDamagePart({
          customFormula: "@abilities.wis.mod * 2",
          types: ["temphp"],
        }),
        range: {
          value: "60",
          units: "ft",
        },
      },
    };
  }

}
