import DDBEnricherData from "../../data/DDBEnricherData";

export default class VisionsOfDistantRealms extends DDBEnricherData {

  override get type() {
    return DDBEnricherData.ACTIVITY_TYPES.CAST;
  }

  override get activity(): IDDBActivityData {
    return {
      addSpellUuid: "Arcane Eye",
      addItemConsume: false,
      data: {
        spell: {
          spellbook: true,
        },
      },
    };
  }
}
