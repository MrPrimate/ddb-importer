import DDBEnricherData from "../../data/DDBEnricherData";

export default class ShapeShifter extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.CAST;
  }

  override get activity(): IDDBActivityData {
    return {
      addSpellUuid: "Polymorph",
      noSpellslot: true,
      addItemConsume: true,
      data: {
        spell: {
          spellbook: true,
        },
      },
    };
  }
}
