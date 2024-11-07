/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../../mixins/DDBEnricherMixin.mjs";

export default class DarkOnesBlessing extends DDBEnricherMixin {

  get type() {
    return "heal";
  }

  get activity() {
    return {
      targetType: "self",
      activationCondition: "Reduce an enemy to 0 HP",
      data: {
        healing: DDBEnricherMixin.basicDamagePart({
          customFormula: "@abilities.cha.mod + @classes.warlock.levels",
          types: ["temphp"],
        }),
      },
    };
  }

}
