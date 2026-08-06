import DDBEnricherData from "../../data/DDBEnricherData";

export default class PluckingAtThreads extends DDBEnricherData {

  get useDefaultAdditionalActivities() {
    return true;
  }

  get activity(): IDDBActivityData | null {
    if (!this.isAction) return null;
    return {
      addItemConsume: true,
      itemConsumeTargetName: "Channel Divinity",
      targetType: "ally",
      rangeSelf: true,
      data: {
        target: {
          template: {
            size: "30",
            units: "ft",
            type: "radius",
          },
        },
      },
    };
  }

  get effects(): IDDBEffectHint[] {
    if (!this.isAction) return [];
    return [
      {
        name: "Plucking at Threads: Fate's Favor",
        options: {
          durationRounds: 1,
          description: "Advantage on attack rolls and saving throws until the end of the cleric's next turn.",
        },
        midiChanges: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("1", 20, "flags.midi-qol.advantage.attack.all"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("1", 20, "flags.midi-qol.advantage.ability.save.all"),
        ],
        daeSpecialDurations: ["turnEndSource"],
      },
    ];
  }

}
