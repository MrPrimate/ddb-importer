import DDBEnricherData from "../../data/DDBEnricherData";

export default class LethargyResilienceRecharge extends DDBEnricherData {

  override get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      data: {
        roll: {
          name: "Days till Recharge",
          formula: "1d4",
        },
      },
    };
  }

  override get override(): IDDBOverrideData {
    return {
      data: {
        system: {
          uses: {
            max: 1,
            spent: 0,
            recovery: [],
          },
        },
      },
    };
  }

}
