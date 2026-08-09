import DDBEnricherData from "../../data/DDBEnricherData";

export default class Channeler extends DDBEnricherData {

  override get type() {
    return DDBEnricherData.ACTIVITY_TYPES.CAST;
  }

  override get activity(): IDDBActivityData {
    return {
      addSpellUuid: "Guidance",
      data: {
        spell: {
          spellbook: true,
        },
      },
    };
  }
}
