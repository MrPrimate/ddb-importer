import DDBEnricherData from "../data/DDBEnricherData";

export default class NeedlerPistol extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  get activity(): IDDBActivityData {
    return {
      type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
      addItemConsume: true,
      data: {
        damage: {
          onSave: "half",
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
        max: "10",
        recovery: [],
        autoDestroy: false,
      },
      retainUseSpent: true,
    };
  }

}
