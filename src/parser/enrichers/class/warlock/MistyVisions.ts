import DDBEnricherData from "../../data/DDBEnricherData";

export default class MistyVisions extends DDBEnricherData {

  override get type() {
    return DDBEnricherData.ACTIVITY_TYPES.CAST;
  }

  override get activity(): IDDBActivityData {
    return {
      addSpellUuid: "Silent Image",
      addItemConsume: false,
      data: {
        spell: {
          spellbook: true,
        },
      },
    };
  }
}
