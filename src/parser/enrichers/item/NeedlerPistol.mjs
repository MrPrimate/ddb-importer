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
      parsingType: "wonderous",
      systemType: {
        value: "trinket",
      },
    };
  }

  get override() {
    return {
      "flags.ddbimporter.retainUseSpent": true,
      data: {
        "system.uses": {
          spent: 0,
          max: "10",
          recovery: [],
          autoDestroy: false,
          autoUse: true,
        },
      },
    };
  }

}
