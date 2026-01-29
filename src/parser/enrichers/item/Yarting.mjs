/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class Yarting extends DDBEnricherData {

  get documentStub() {
    return {
      documentType: "tool",
      parsingType: "tool",
      systemType: {
        value: "music",
        baseItem: "",
      },
    };
  }


}
