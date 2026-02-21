import DDBEnricherData from "../../data/DDBEnricherData";

export default class BendLuck extends DDBEnricherData {

  get type() {
    return "utility";
  }

  get activity() {
    return {
      name: "Bend Luck Roll",
      data: {
        roll: {
          prompt: false,
          visible: true,
          formula: "1d4",
          name: "Bend Luck Roll",
        },
      },
    };
  }

}
