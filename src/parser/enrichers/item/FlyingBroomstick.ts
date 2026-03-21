import DDBEnricherData from "../data/DDBEnricherData";

export default class FlyingBroomstick extends DDBEnricherData {

  get documentStub(): IDDBDocumentStub {
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
