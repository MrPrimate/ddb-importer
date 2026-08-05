import DDBEnricherData from "../../data/DDBEnricherData";

export default class WarChatter extends DDBEnricherData {

  get useDefaultAdditionalActivities() {
    return true;
  }

  get effects(): IDDBEffectHint[] {
    // the same-named DDB action also loads this enricher and its effect is
    // cloned onto the trait with the activity - skip the trait-side copy
    if (!this.isAction) return [];
    return [
      {
        name: "War Chatter",
        options: {
          durationRounds: 1,
          description: "Disadvantage on attack rolls until the start of your next turn.",
        },
        daeSpecialDurations: ["turnStartSource"],
        midiChanges: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("1", 20, "flags.midi-qol.disadvantage.attack.all"),
        ],
        ac5eChanges: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("1", 20, "flags.automated-conditions-5e.attack.disadvantage"),
        ],
      },
    ];
  }

}
