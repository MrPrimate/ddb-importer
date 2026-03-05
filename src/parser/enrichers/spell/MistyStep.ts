import DDBEnricherData from "../data/DDBEnricherData";

export default class MistyStep extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.DDBMACRO;
  }

  get activity(): IDDBActivityData {
    return {
      data: {
        name: "Misty Step",
        macro: {
          name: "Misty Step Macro",
          function: "ddb.spell.mistyStep",
          visible: false,
          parameters: "",
        },
      },
    };
  }

}
