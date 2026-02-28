import DDBEnricherData from "../../data/DDBEnricherData";

export default class LethargyResilienceRecharge extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity() {
    return {
      data: {
        roll: {
          name: "Days till Recharge",
          formula: "1d4",
        },
      },
    };
  }

  get override() {
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
