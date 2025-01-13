/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class SpellRefuelingRingReaction extends DDBEnricherData {

  get type() {
    return "ddbmacro";
  }

  get activity() {
    return {
      name: "Use Spell-Refueling Ring",
      activationType: "action",
      addActivityConsume: true,
      data: {
        macro: {
          name: "Activate Macro",
          function: "ddb.item.spellRefuelingRing",
          visible: false,
          parameters: "",
        },
      },
    };
  }

  get override() {
    return {
      data: {
        name: "Spell-Refueling Ring: Activate",
      },
    };
  }

}
