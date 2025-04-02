/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class FlyingBroomstick extends DDBEnricherData {

  get documentStub() {
    return {
      documentType: "equipment",
      parsingType: "wonderous",
      replaceDefaultActivity: false,
      systemType: {
        value: "trinket",
      },
    };
  }

  get stopDefaultActivity() {
    return true;
  }

}
