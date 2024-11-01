/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../../DDBEnricherMixin.js";

export default class LayOnHands extends DDBEnricherMixin {

  get activity() {
    return {
      type: "heal",
      name: "Healing",
      addItemConsume: true,
      addScalingMode: "amount",
      addScalingFormula: "1",
      data: {
        "consumption.scaling": {
          allowed: true,
          max: "@item.uses.max - @item.uses.spent",
        },
        healing: DDBEnricherMixin.basicDamagePart({ bonus: "1", types: ["healing"], scalingMode: "whole", scalingFormula: "1" }),
      },
    };
  }

  get additionalActivities() {
    return [
      {
        constructor: {
          name: "Lay On Hands Macro",
          type: "ddbmacro",
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

  get override() {
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
