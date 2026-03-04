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
    ];
  }

}
