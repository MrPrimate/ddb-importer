/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class SlayersPrey extends DDBEnricherData {

  get addAutoAdditionalActivities() {
    return true;
  }

}
