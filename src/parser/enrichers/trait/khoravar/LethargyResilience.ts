import { Generic } from "../_module";

export default class LethargyResilience extends Generic.Generic {

  get type() {
    return Generic.Generic.ACTIVITY_TYPES.UTILITY;
  }

  get activity() {
    return {
      name: "Use Lethargy Resilience",
      addItemConsume: true,
      activationType: "special",
      targetType: "self",
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
