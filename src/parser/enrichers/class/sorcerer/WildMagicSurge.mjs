/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class WildMagicSurge extends DDBEnricherData {

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
          max: "",
          recovery: [],
        },
      },
    };
  }

}
