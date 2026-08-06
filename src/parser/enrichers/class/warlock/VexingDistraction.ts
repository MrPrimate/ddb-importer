import DDBEnricherData from "../../data/DDBEnricherData";

export default class VexingDistraction extends DDBEnricherData {

  get useDefaultAdditionalActivities() {
    return true;
  }

  get activity(): IDDBActivityData | null {
    if (!this.isAction) return null;
    return {
      data: {
        midiProperties: {
          chooseEffects: true,
        },
      },
    };
  }

  get effects(): IDDBEffectHint[] {
    if (!this.isAction) return [];
    return [
      {
        name: "Vexing Distraction: Annoyed",
        options: {
          durationRounds: 1,
          description: "Disadvantage on D20 Tests until the end of the warlock's next turn.",
        },
        midiChanges: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("1", 20, "flags.midi-qol.disadvantage.all"),
        ],
        daeSpecialDurations: ["turnEndSource"],
      },
      {
        name: "Vexing Distraction: Confounded",
        options: {
          durationRounds: 1,
          description: "Speed reduced to 0 until the end of the warlock's next turn.",
        },
        changes: [
          DDBEnricherData.ChangeHelper.multiplyChange("0", 50, "system.attributes.movement.walk"),
        ],
        daeSpecialDurations: ["turnEndSource"],
      },
    ];
  }

}
