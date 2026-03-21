import DDBEnricherData from "../data/DDBEnricherData";

export default class ParalysisPistol extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  get activity(): IDDBActivityData {
    return {
      type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
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

  get documentStub(): IDDBDocumentStub {
    return {
      documentType: "consumable",
      parsingType: "wondrous",
      systemType: {
        value: "wondrous",
      },
    };
  }

  get override(): IDDBOverrideData {
    return {
      uses: {
        spent: null,
        max: "6",
        recovery: [],
        autoDestroy: false,
      },
      retainUseSpent: true,
    };
  }

}
