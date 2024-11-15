/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../mixins/DDBEnricherData.mjs";

export default class Empty extends DDBEnricherData {

  get type() {
    return null;
  }

}
