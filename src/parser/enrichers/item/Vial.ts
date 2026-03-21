import DDBEnricherData from "../data/DDBEnricherData";

export default class Vial extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.NONE;
  }

  get documentStub(): IDDBDocumentStub {
    return {
      documentType: "consumable",
      parsingType: "consumable",
      systemType: {
        value: "potion",
      },
    };
  }

}
