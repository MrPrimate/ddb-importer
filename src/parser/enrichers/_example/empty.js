/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../mixins/DDBEnricherMixin.mjs";

export default class Empty extends DDBEnricherMixin {

  get type() {
    return null;
  }

}
