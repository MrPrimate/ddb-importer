/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../../mixins/DDBEnricherMixin.mjs";

export default class WildMagicSurge extends DDBEnricherMixin {

  get type() {
    return "utility";
  }

  get activity() {
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

  get override() {
    return {
      data: {
        "system.uses": {
          spent: null,
          max: null,
          recovery: [],
        },
      },
    };
  }

}
