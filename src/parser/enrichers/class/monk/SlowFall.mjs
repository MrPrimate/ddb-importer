/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../../mixins/DDBEnricherMixin.mjs";

export default class SlowFall extends DDBEnricherMixin {

  get type() {
    if (this.is2014) return null;
    return "heal";
  }

  get activity() {
    if (this.is2014) return null;
    return {
      activationType: "reaction",
      targetType: "self",
      data: {
        healing: DDBEnricherMixin.basicDamagePart({ customFormula: "@classes.sorcerer.levels", types: ["healing"] }),
      },
    };
  }

}
