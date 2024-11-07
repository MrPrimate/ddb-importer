/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../../mixins/DDBEnricherMixin.mjs";

export default class DreadAmbusher extends DDBEnricherMixin {

  get type() {
    return "none";
  }

  get additionalActivities() {
    return [
      { action: { name: "Dreadful Strike", type: "class" } },
    ];
  }

}
