import DDBEnricherData from "../../data/DDBEnricherData";

export default class LayOnHands extends DDBEnricherData {

  get activity() {
    return {
      type: DDBEnricherData.ACTIVITY_TYPES.HEAL,
      name: "Healing",
      addItemConsume: true,
      addScalingMode: "amount",
      addScalingFormula: "1",
      data: {
        "consumption.scaling": {
          allowed: true,
          max: "@item.uses.max - @item.uses.spent",
        },
        healing: DDBEnricherData.basicDamagePart({ bonus: "1", types: ["healing"], scalingMode: "whole", scalingFormula: "1" }),
      },
    };
  }

  get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Lay On Hands Macro",
          type: DDBEnricherData.ACTIVITY_TYPES.DDBMACRO,
        },
        build: {
          generateConsumption: false,
          generateTarget: false,
          generateRange: false,
          generateActivation: true,
          generateDDBMacro: true,
          ddbMacroOverride: {
            name: "Lay On Hands Macro",
            function: "ddb.feat.layOnHands",
            visible: false,
            parameters: "",
          },
        },
      },
      { action: { name: "Lay On Hands: Purify Poison", type: "class", rename: ["Purify Poison"] } },
    ];
  }

  get override(): IDDBOverrideData {
    const name = this.is2014 ? "Lay on Hands Pool" : "Lay On Hands: Healing Pool";
    const uses = this._getUsesWithSpent({ type: "class", name, max: "5 * @classes.paladin.levels", period: "lr" });
    return {
      data: {
        name: "Lay On Hands",
        system: {
          uses,
        },
      },
    };
  }


}
