import DDBEnricherData from "../../data/DDBEnricherData";

export default class SorcerousRestoration extends DDBEnricherData {

  override get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      noConsumeTargets: true,
      additionalConsumptionTargets: [
        {
          type: "itemUses",
          target: "",
          value: "-(floor(@classes.sorcerer.levels / 2))",
          scaling: {
            mode: "",
            formula: "",
          },
        },
        {
          type: "itemUses",
          target: "",
          value: "1",
          scaling: {
            mode: "",
            formula: "",
          },
        },
      ],
    };
  }

  override get override(): IDDBOverrideData {
    return {
      retainChildUses: true,
    };
  }

}
