import DDBEnricherData from "../../data/DDBEnricherData";

export default class ShroudOfShadow extends DDBEnricherData {

  override get type() {
    return DDBEnricherData.ACTIVITY_TYPES.CAST;
  }

  override get activity(): IDDBActivityData {
    return {
      addSpellUuid: "Invisibility",
      addItemConsume: false,
      data: {
        spell: {
          spellbook: true,
        },
      },
    };
  }
}
