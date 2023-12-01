import DDBHelper from "../../lib/DDBHelper.js";
import DDBChoiceFeature from "./DDBChoiceFeature.js";
import DDBFeature from "./DDBFeature.js";


export default class DDBFeatures {

  constructor({ ddbData, rawCharacter = null } = {}) {
    this.ddbData = ddbData;
    this.rawCharacter = rawCharacter;
  }


  getFeatures(featDefinition, type) {
    const source = DDBHelper.parseSource(featDefinition);
    const ddbFeature = new DDBFeature({
      ddbData: this.ddbData,
      ddbDefinition: featDefinition,
      rawCharacter: this.rawCharacter,
      type,
      source,
    });

    ddbFeature.build();
    if (ddbFeature.isChoiceFeature) {
      return DDBChoiceFeature.buildChoiceFeatures(ddbFeature);
    } else {
      return [ddbFeature.data];
    }
  }

  build() {


  }
}
