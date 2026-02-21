import DDBEnricherData from "../data/DDBEnricherData";

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
