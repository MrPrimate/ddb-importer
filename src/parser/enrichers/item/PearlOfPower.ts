import DDBEnricherData from "../data/DDBEnricherData";

export default class PearlOfPower extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.DDBMACRO;
  }

  get activity(): IDDBActivityData {
    return {
      name: "Use Pearl of Power",
      addItemConsume: true,
      data: {
        macro: {
          name: "Activate Macro",
          function: "ddb.item.pearlOfPower",
          visible: false,
          parameters: "",
        },
      },
    };
  }
}
