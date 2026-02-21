import DDBEnricherData from "../data/DDBEnricherData";

export default class MistyStep extends DDBEnricherData {

  get type() {
    return "ddbmacro";
  }

  get activity() {
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
