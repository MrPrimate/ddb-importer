import DDBEnricherData from "../../data/DDBEnricherData";

export default class Channeler extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.CAST;
  }

  get activity(): IDDBActivityData {
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
