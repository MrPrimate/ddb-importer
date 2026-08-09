import DDBEnricherData from "../data/DDBEnricherData";

export default class Yarting extends DDBEnricherData {

  override get documentStub(): IDDBDocumentStub {
    return {
      documentType: "tool",
      parsingType: "tool",
      systemType: {
        value: "music",
        baseItem: "yarting",
      },
    };
  }


}
