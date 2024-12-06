/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class Generic extends DDBEnricherData {

  get actionType() {
    return "class";
  }

  get useDefaultAdditionalActivities() {
    return true;
  }

  get override() {
    // console.warn(`Generic override for ${this.data.name}`, {
    //   this: this,
    // });
    return null;
  }

}
