import DDBEnricherData from "../data/DDBEnricherData";

export default class MageSlayer extends DDBEnricherData {

  get activity(): IDDBActivityData {
    return {
      name: "Guarded Mind",
      type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
    };
  }

  get override(): IDDBOverrideData {
    return {
      retainResourceConsumption: true,
      uses: {
        spent: null,
        max: "1",
        recovery: [{ period: "sr", type: "recoverAll" }],
      },
      data: {
        name: "Mage Slayer",
      },
    };
  }

}
