/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class Empty extends DDBEnricherData {

  get type() {
    return null;
  }

  get effects() {
    return [];
  }

}
