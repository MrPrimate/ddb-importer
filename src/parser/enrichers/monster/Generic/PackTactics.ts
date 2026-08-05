import DDBEnricherData from "../../data/DDBEnricherData";

export default class PackTactics extends DDBEnricherData {

  get effects(): IDDBEffectHint[] {
    return [
      {
        options: {
          transfer: true,
        },
        name: "Pack Tactics",
        midiOnly: true,
        midiChanges: [
          DDBEnricherData.ChangeHelper.customChange("findNearby(-1, targetUuid, 5, 0).length > 1", 20, "flags.midi-qol.advantage.attack.all"),
        ],
      },
      {
        options: {
          transfer: true,
        },
        name: "Pack Tactics",
        ac5eOnly: true,
        midiNever: true,
        ac5eChanges: [
          DDBEnricherData.ChangeHelper.customChange(
            "checkNearby(opponentId, 'different', 5, {count:(distance <= 5 ? 2 : 1)})",
            20,
            "flags.automated-conditions-5e.attack.advantage",
          ),
        ],
      },
    ];
  }

}
