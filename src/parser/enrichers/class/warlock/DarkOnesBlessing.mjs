/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class DarkOnesBlessing extends DDBEnricherData {

  get type() {
    return "heal";
  }

  get activity() {
    return {
      targetType: "self",
      activationCondition: "Reduce an enemy to 0 HP",
      data: {
        healing: DDBEnricherData.basicDamagePart({
          customFormula: "@abilities.cha.mod + @classes.warlock.levels",
          types: ["temphp"],
        }),
      },
    };
  }

}
