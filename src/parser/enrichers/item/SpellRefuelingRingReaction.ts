import DDBEnricherData from "../data/DDBEnricherData";

export default class SpellRefuelingRingReaction extends DDBEnricherData {

  override get type() {
    return DDBEnricherData.ACTIVITY_TYPES.DDBMACRO;
  }

  override get activity(): IDDBActivityData {
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

  override get override(): IDDBOverrideData {
    return {
      data: {
        name: "Spell-Refueling Ring: Activate",
      },
    };
  }

}
