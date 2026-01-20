/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class NeedlerPistol extends DDBEnricherData {

  get type() {
    return "save";
  }

  get activity() {
    return {
      type: "save",
      addItemConsume: true,
      data: {
        damage: {
          onSave: "half",
        },
      },
    };
  }

  get documentStub() {
    return {
      documentType: "consumable",
      parsingType: "wondrous",
      systemType: {
        value: "wondrous",
      },
    };
  }

  get override() {
    return {
      "flags.ddbimporter.retainUseSpent": true,
      data: {
        "system.uses": {
          spent: null,
          max: "10",
          recovery: [],
          autoDestroy: false,
          autoUse: true,
        },
      },
    };
  }

}
