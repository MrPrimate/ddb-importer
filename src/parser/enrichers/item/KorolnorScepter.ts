import DDBEnricherData from "../data/DDBEnricherData";

export default class KorolnorScepter extends DDBEnricherData {

  get documentStub() {
    return {
      // scepter can be used as a regular club
      documentType: "weapon",
      parsingType: "weapon",
      replaceDefaultActivity: false,
      systemType: {
        value: "simpleM",
        baseItem: "club",
      },
      copySRD: {
        name: "Club",
        type: "weapon",
        uuid: "Compendium.dnd5e.items.Item.nfIRTECQIG81CvM4",
      },
    };
  }

  get stopDefaultActivity() {
    return true;
  }

}
