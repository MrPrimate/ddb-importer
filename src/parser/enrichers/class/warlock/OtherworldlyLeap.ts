import DDBEnricherData from "../../data/DDBEnricherData";

export default class OtherworldlyLeap extends DDBEnricherData {

  override get type() {
    return DDBEnricherData.ACTIVITY_TYPES.CAST;
  }

  override get activity(): IDDBActivityData {
    return {
      addSpellUuid: "Jump",
      addItemConsume: false,
      data: {
        spell: {
          spellbook: true,
        },
      },
    };
  }
}
