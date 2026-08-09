import { Generic } from "../_module";

export default class LethargyResilience extends Generic.Generic {

  override get type(): IDDBActivityType | null {
    return Generic.Generic.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Use Lethargy Resilience",
      addItemConsume: true,
      activationType: "special",
      targetType: "self",
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
