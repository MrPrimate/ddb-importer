import DDBEnricherData from "../../data/DDBEnricherData";

export default class VoiceOfDeath extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.CAST;
  }

  get activity(): IDDBActivityData {
    return {
      addSpellUuid: "Speak with Dead",
      addItemConsume: true,
      data: {
        spell: {
          spellbook: true,
        },
      },
    };
  }

}
