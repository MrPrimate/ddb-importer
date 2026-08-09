import DDBEnricherData from "../../data/DDBEnricherData";

export default class ChainsOfCarceri extends DDBEnricherData {

  override get type() {
    return DDBEnricherData.ACTIVITY_TYPES.CAST;
  }

  override get activity(): IDDBActivityData {
    return {
      addSpellUuid: "Hold Monster",
      addItemConsume: false,
      data: {
        spell: {
          spellbook: true,
        },
      },
    };
  }
}
