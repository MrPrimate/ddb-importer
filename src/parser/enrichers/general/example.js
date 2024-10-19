/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../DDBEnricherMixin.js";

export default class Example extends DDBEnricherMixin {

  get additionalActivities() {
    return [];
  }

}
