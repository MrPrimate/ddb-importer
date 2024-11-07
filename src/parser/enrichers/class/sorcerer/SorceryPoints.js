/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../../mixins/DDBEnricherMixin.mjs";

export default class SorceryPoints extends DDBEnricherMixin {

  get type() {
    return "none";
  }

  get additionalActivities() {
    return [
      { action: { name: "Font of Magic", type: "class" } },
    ];

  }

}
