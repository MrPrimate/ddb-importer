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

  // DDB ships no action (and so no limited use) for this feature; the activities consume item uses, which need a max
  override get override(): IDDBOverrideData {
    return {
      uses: { spent: null, max: "1", recovery: [{ period: "sr", type: "recoverAll", formula: undefined }] },
    };
  }

}
