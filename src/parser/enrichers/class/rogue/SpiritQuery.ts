import DDBEnricherData from "../../data/DDBEnricherData";

export default class SpiritQuery extends DDBEnricherData {

  override get type() {
    return DDBEnricherData.ACTIVITY_TYPES.CAST;
  }

  override get activity(): IDDBActivityData {
    return {
      addSpellUuid: "Augury",
      addItemConsume: true,
      data: {
        spell: {
          spellbook: true,
        },
      },
    };
  }

}
