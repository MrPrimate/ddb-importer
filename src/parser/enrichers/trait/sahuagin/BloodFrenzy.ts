import DDBEnricherData from "../../data/DDBEnricherData";

export default class BloodFrenzy extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity(): IDDBActivityData {
    return {
      targetType: "self",
      activationType: "bonus",
    };
  }

  get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Blood Frenzy",
        options: {
          durationSeconds: 60,
          description: "Advantage on attack rolls against creatures that don't have all their hit points.",
        },
        midiChanges: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("1", 20, "flags.midi-qol.advantage.attack.all"),
        ],
        ac5eChanges: [
          DDBEnricherData.ChangeHelper.customChange(
            "opponentActor.attributes.hp.value < opponentActor.attributes.hp.max",
            20,
            "flags.automated-conditions-5e.attack.advantage",
          ),
        ],
      },
    ];
  }

}
