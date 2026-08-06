import DDBEnricherData from "../../data/DDBEnricherData";

export default class FutureSight extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity(): IDDBActivityData {
    return {
      targetType: "self",
      activationType: "action",
      addItemConsume: true,
      data: {
        range: {
          units: "self",
        },
        duration: {
          value: "1",
          units: "hour",
        },
      },
    };
  }

  get effects(): IDDBEffectHint[] {
    if (this.isAction) return [];
    return [
      {
        name: "Future Sight",
        options: {
          durationSeconds: 3600,
          description: "While not Incapacitated or Blinded, you have Advantage on all attack rolls and attacks against you have Disadvantage.",
        },
        midiChanges: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("1", 20, "flags.midi-qol.advantage.attack.all"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("1", 20, "flags.midi-qol.grants.disadvantage.attack.all"),
        ],
        ac5eChanges: [
          DDBEnricherData.ChangeHelper.customChange("1", 20, "flags.automated-conditions-5e.attack.advantage"),
          DDBEnricherData.ChangeHelper.customChange("1", 20, "flags.automated-conditions-5e.grants.attack.disadvantage"),
        ],
      },
    ];
  }

}
