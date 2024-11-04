/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../../DDBEnricherMixin.js";

export default class Empty extends DDBEnricherMixin {

  get type() {
    return null;
  }

}
