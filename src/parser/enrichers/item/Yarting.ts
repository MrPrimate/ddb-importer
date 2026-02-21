import DDBEnricherData from "../data/DDBEnricherData";

export default class Yarting extends DDBEnricherData {

  get documentStub() {
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
