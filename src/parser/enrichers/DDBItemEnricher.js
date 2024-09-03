import DDBItemActivity from "../item/DDBItemActivity.js";
import DDBBaseEnricher from "./DDBBaseEnricher.js";

export default class DDDItemEnricher extends DDBBaseEnricher {
  constructor({ ddbParser, document, name = null } = {}) {
    super({ ddbParser, document, name });
    this._prepare();
    this.additionalActivityClass = DDBItemActivity;
  }

  NAME_HINTS = {};

  ACTIVITY_HINTS = {
    "Oil of Sharpness": {
      type: "enchant",
      allowMagical: true,
    },
    "Arcane Oil": {
      type: "enchant",
    },
    "Donjon's Sundering Sphere": {
      type: "enchant",
    },
  };

  DOCUMENT_OVERRIDES = {

  };

  EFFECT_HINTS = {
    "Oil of Sharpness": {
      type: "enchant",
      magicalBonus: {
        bonus: "3",
      },
    },
    "Arcane Oil": {
      type: "enchant",
      magicalBonus: {
        makeMagical: false,
        bonus: "2",
      },
    },
    "Donjon's Sundering Sphere": {
      type: "enchant",
      magicalBonus: {
        bonus: "1",
      },
    },
  };

  DOCUMENT_STUB = {
    "Korolnor Scepter": {
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
    },
  };

  ADDITIONAL_ACTIVITIES = {
    "Donjon's Sundering Sphere": [
      {
        constructor: {
          name: "Isolating Smite: Save vs Banishment",
          type: "save",
        },
        build: {
          generateSave: true,
          generateUses: true,
          usesOverride: {
            max: 1,
            spent: 0,
            prompt: true,
            recovery: [{ period: "lr", type: "recoverAll" }],
          },
        },
        overrides: {
          addActivityConsume: true,
        },
      },
    ],
  };
}
