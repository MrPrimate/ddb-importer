import DDBEnricherData from "../data/DDBEnricherData";

export default class FlyingBroomstick extends DDBEnricherData {

  override get documentStub(): IDDBDocumentStub {
    return {
      documentType: "equipment",
      parsingType: "wondrous",
      replaceDefaultActivity: false,
      systemType: {
        value: "wondrous",
      },
    };
  }

  override get stopDefaultActivity() {
    return true;
  }

}
