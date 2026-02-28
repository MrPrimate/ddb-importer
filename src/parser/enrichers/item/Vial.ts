import DDBEnricherData from "../data/DDBEnricherData";

export default class Vial extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.NONE;
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
