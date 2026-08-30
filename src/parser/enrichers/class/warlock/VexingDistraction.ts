import DDBEnricherData from "../../data/DDBEnricherData";

export default class VexingDistraction extends DDBEnricherData {

  override get useDefaultAdditionalActivities(): boolean {
    return true;
  }

  override get activity(): IDDBActivityData | null {
    if (!this.isAction) return null;
    return {
      data: {
        midiProperties: {
          chooseEffects: true,
        },
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    if (!this.isAction) return [];
    return [
      {
        name: "Vexing Distraction: Annoyed",
        options: {
          expiry: "sourceEnd",
          description: "Disadvantage on D20 Tests until the end of the warlock's next turn.",
        },
        midiChanges: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("1", 20, "flags.midi-qol.disadvantage.all"),
        ],
      },
      {
        name: "Vexing Distraction: Confounded",
        options: {
          expiry: "sourceEnd",
          description: "Speed reduced to 0 until the end of the warlock's next turn.",
        },
        changes: [
          DDBEnricherData.ChangeHelper.movementMultiplierChange("0", 50),
        ],
      },
    ];
  }

}
