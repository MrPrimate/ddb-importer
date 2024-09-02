import DDBItemActivity from "../item/DDBItemActivity.js";
import DDBBaseEnricher from "./DDBBaseEnricher.js";

export default class DDDItemEnricher extends DDBBaseEnricher {
  constructor({ document, name = null } = {}) {
    super({ document, name });
    this._prepare();
    this.additionalActivityClass = DDBItemActivity;
  }

  NAME_HINTS = {};

  ACTIVITY_HINTS = {

  };

  DOCUMENT_OVERRIDES = {

  };

  EFFECT_HINTS = {

  };

  DOCUMENT_STUB = {
    "Korolnor Scepter": {
      // scepter can be used as a regular club
      documentType: "weapon",
      parsingType: "weapon",
      systemType: {
        value: "simpleM",
        baseItem: "club",
      },
      copySRD: {
        name: "Club",
        type: "weapon",
        uuid: "Compendium.dnd5e.items.Item.nfIRTECQIG81CvM4",
      },
    },
  };
}
