import DDBEnricherData from "../../data/DDBEnricherData";

export default class WildMagicSurge extends DDBEnricherData {

  override get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Roll for Surge Change (Nat 20)",
      data: {
        roll: {
          prompt: false,
          visible: true,
          formula: "1d20",
          name: "Roll for Surge Change",
        },
      },
    };
  }

  override get override(): IDDBOverrideData {
    return {
      uses: {
        spent: null,
        max: "",
        recovery: [],
      },
    };
  }

}
