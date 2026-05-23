import DDBEnricherData from "../data/DDBEnricherData";

export default class LordsAllianceAgent extends DDBEnricherData {

  get activity(): IDDBActivityData {
    return {
      name: "Reassert Honor",
      activationType: "special",
      targetType: "enemy",
      data: {
        range: {
          units: "spec",
        },
      },
    };
  }

  get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Reassert Honor: Advantage Mark",
        daeSpecialDurations: ["1Attack" as const],
        data: {
          duration: {
            value: 6,
            expiry: "turnStart",
            expired: null,
          },
        },
        midiChanges: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("1", 20, "flags.midi-qol.advantage.attack.all"),
        ],
      },
    ];
  }

}
