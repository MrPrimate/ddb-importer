import DDBEnricherData from "../../data/DDBEnricherData";

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
      uses: {
        spent: null,
        max: "",
        recovery: [],
      },
    };
  }

}
