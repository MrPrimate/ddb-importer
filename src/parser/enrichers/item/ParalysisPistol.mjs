/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class ParalysisPistol extends DDBEnricherData {

  get type() {
    return "save";
  }

  get activity() {
    return {
      type: "save",
      addItemConsume: true,
      targetType: "creature",
      data: {
        range: {
          value: "60",
          units: "ft",
        },
        target: {
          "affects": {
            "count": "1",
            "type": "creature",
          },
          "template": {
            "contiguous": false,
            "type": "",
            "size": "",
            "units": "ft",
          },
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
      data: {
        "flags.ddbimporter.retainUseSpent": true,
        "system.uses": {
          spent: null,
          max: "6",
          recovery: [],
          autoDestroy: false,
          autoUse: true,
        },
      },
    };
  }

}
