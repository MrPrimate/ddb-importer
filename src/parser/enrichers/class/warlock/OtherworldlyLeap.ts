import DDBEnricherData from "../../data/DDBEnricherData";

export default class OtherworldlyLeap extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.CAST;
  }

  get activity(): IDDBActivityData {
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
