/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../mixins/DDBEnricherMixin.mjs";

export default class KorolnorScepter extends DDBEnricherMixin {

  get documentStub() {
    return {
      // scepter can be used as a regular club
      documentType: "weapon",
      parsingType: "weapon",
      stopDefaultActivity: true,
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

}
