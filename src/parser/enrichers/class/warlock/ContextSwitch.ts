import DDBEnricherData from "../../data/DDBEnricherData";

export default class ContextSwitch extends DDBEnricherData {

  get useDefaultAdditionalActivities() {
    return true;
  }

  get effects(): IDDBEffectHint[] {
    if (!this.isAction) return [];
    return [
      {
        name: "Context Switch: Switched",
        options: {
          durationSeconds: 6,
          description: "An enemy swapped into the attack has Disadvantage on attack rolls until the start of the warlock's next turn.",
        },
        midiChanges: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("1", 20, "flags.midi-qol.disadvantage.attack.all"),
        ],
        daeSpecialDurations: ["turnStartSource"],
      },
    ];
  }

}
