import DDBEnricherData from "../../data/DDBEnricherData";

export default class BlessedChosen extends DDBEnricherData {

  get useDefaultAdditionalActivities() {
    return true;
  }

  get activity(): IDDBActivityData | null {
    if (!this.isAction) return null;
    return {
      targetType: "enemy",
      activationCondition: "An enemy within 30 ft attacks one of your allies",
      data: {
        range: {
          units: "ft",
          value: "30",
        },
      },
    };
  }

  get effects(): IDDBEffectHint[] {
    if (!this.isAction) return [];
    return [
      {
        name: "Blessed Chosen: Disadvantage",
        options: {
          durationRounds: 1,
          description: "Disadvantage on the triggering attack roll.",
        },
        midiChanges: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("1", 20, "flags.midi-qol.disadvantage.attack.all"),
        ],
        ac5eChanges: [
          DDBEnricherData.ChangeHelper.customChange("once; 1", 20, "flags.automated-conditions-5e.attack.disadvantage"),
        ],
      },
    ];
  }

}
