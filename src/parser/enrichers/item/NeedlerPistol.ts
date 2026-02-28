import DDBEnricherData from "../data/DDBEnricherData";

export default class NeedlerPistol extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
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
      uses: {
        spent: null,
        max: "10",
        recovery: [],
        autoDestroy: false,
        autoUse: true,
      },
      retainUseSpent: true,
    };
  }

}
