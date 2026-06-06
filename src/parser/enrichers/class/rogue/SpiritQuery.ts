import DDBEnricherData from "../../data/DDBEnricherData";

export default class SpiritQuery extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.CAST;
  }

  get activity(): IDDBActivityData {
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
