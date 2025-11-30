/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class Vial extends DDBEnricherData {

  get type() {
    return "none";
  }

  get documentStub() {
    return {
      documentType: "consumable",
      parsingType: "consumable",
      systemType: {
        value: "potion",
      },
    };
  }

}
