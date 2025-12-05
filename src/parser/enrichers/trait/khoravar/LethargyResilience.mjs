/* eslint-disable class-methods-use-this */
import { Generic } from "../_module.mjs";

export default class LethargyResilience extends Generic.Generic {

  get type() {
    return "utility";
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
