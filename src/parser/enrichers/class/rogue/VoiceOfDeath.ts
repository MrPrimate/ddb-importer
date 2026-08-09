import DDBEnricherData from "../../data/DDBEnricherData";

export default class VoiceOfDeath extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.CAST;
  }

  override get activity(): IDDBActivityData {
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
