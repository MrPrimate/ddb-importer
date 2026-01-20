/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class FlyingBroomstick extends DDBEnricherData {

  get documentStub() {
    return {
      documentType: "equipment",
      parsingType: "wondrous",
      replaceDefaultActivity: false,
      systemType: {
        value: "wondrous",
      },
    };
  }

  get stopDefaultActivity() {
    return true;
  }

}
