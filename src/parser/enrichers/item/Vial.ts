import DDBEnricherData from "../data/DDBEnricherData";

export default class Vial extends DDBEnricherData {

  override get type() {
    return DDBEnricherData.ACTIVITY_TYPES.NONE;
  }

  override get documentStub(): IDDBDocumentStub {
    return {
      documentType: "consumable",
      parsingType: "consumable",
      systemType: {
        value: "potion",
      },
    };
  }

}
