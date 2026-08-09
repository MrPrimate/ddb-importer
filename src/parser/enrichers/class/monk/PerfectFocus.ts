import DDBEnricherData from "../../data/DDBEnricherData";

export default class PerfectFocus extends DDBEnricherData {

  override get type() {
    return DDBEnricherData.ACTIVITY_TYPES.DDBMACRO;
  }

  override get activity(): IDDBActivityData {
    return {
      type: DDBEnricherData.ACTIVITY_TYPES.DDBMACRO,
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
