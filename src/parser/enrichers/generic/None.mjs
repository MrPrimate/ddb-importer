/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class None extends DDBEnricherData {

  get type() {
    return "none";
  }

  get additionalActivities() {
    return [];
  }

}
