import DDBEnricherData from "../../data/DDBEnricherData";

export default class PerfectFocus extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.DDBMACRO;
  }

  get activity() {
    return {
      type: "ddbmacro",
      data: {
        name: "Recover Focus",
        macro: {
          name: "Recover Focus",
          function: "ddb.feat.perfectFocus",
          visible: false,
          parameters: "",
        },
      },
    };
  }

}
