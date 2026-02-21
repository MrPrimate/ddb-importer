import DDBEnricherData from "../../data/DDBEnricherData";

export default class TandemFootwork extends DDBEnricherData {

  get type() {
    return "utility";
  }

  get activity() {
    return {
      activationType: "special",
      data: {
        roll: {
          prompt: false,
          visible: false,
          formula: "@scale.bard.inspiration",
          name: "Initiative bonus",
        },
      },
    };
  }

}
