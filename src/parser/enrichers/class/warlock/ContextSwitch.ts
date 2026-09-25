import DDBEnricherData from "../../data/DDBEnricherData";

export default class ContextSwitch extends DDBEnricherData {

  override get useDefaultAdditionalActivities(): boolean {
    return true;
  }

  override get effects(): IDDBEffectHint[] {
    if (!this.isAction) return [];
    return [
      {
        name: "Context Switch: Switched",
        options: {
          expiry: "sourceStart",
          description: "An enemy swapped into the attack has Disadvantage on attack rolls until the start of the warlock's next turn.",
        },
        midiChanges: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("1", 20, "flags.midi-qol.disadvantage.attack.all"),
        ],
      },
    ];
  }

}
