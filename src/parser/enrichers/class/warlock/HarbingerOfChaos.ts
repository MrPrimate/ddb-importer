import DDBEnricherData from "../../data/DDBEnricherData";

export default class HarbingerOfChaos extends DDBEnricherData {

  override get useDefaultAdditionalActivities(): boolean {
    return true;
  }

  override get effects(): IDDBEffectHint[] {
    if (!this.isAction) return [];
    return [
      {
        name: "Harbinger of Chaos: Altered Reality",
        options: {
          expiry: "targetEnd",
          description: "Disadvantage on all D20 Tests until the end of its next turn; the warlock and their allies have Advantage on attack rolls and D20 Tests against it.",
        },
        midiChanges: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("1", 20, "flags.midi-qol.disadvantage.all"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("1", 20, "flags.midi-qol.grants.advantage.attack.all"),
        ],
      },
    ];
  }

}
