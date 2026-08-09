import DDBEnricherData from "../data/DDBEnricherData";

export default class PearlOfPower extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.DDBMACRO;
  }

  override get activity(): IDDBActivityData {
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
