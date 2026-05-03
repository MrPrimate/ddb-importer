import DDBEnricherData from "../../data/DDBEnricherData";

export default class ArcanePrototype extends DDBEnricherData {

  get activity(): IDDBActivityData {
    return {
      type: DDBEnricherData.ACTIVITY_TYPES.DDBMACRO,
      data: {
        macro: {
          name: "Create Arcane Prototype",
          function: "ddb.feat.arcanePrototype",
          visible: false,
          parameters: "",
        },
      },
    };
  }

  get override(): IDDBOverrideData {
    return {
      data: {
        system: {
          uses: {
            spent: 0,
            max: "@scale.maverick.arcane-charges",
            recovery: [{ period: "lr", type: "recoverAll", formula: undefined }],
          },
        },
      },
    };
  }

}
