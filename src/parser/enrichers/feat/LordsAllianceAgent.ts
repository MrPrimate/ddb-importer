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
        options: {
          description: "Advantage on the next attack roll. DAE or AC5e end the effect after the one attack; without them it lasts until the start of the next turn.",
        },
        // DAE and AC5e each end the effect after the one attack; the duration is the ceiling
        daeSpecialDurations: ["1Attack" as const],
        data: {
          duration: {
            turns: 1,
          },
        },
        midiChanges: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("1", 20, "flags.midi-qol.advantage.attack.all"),
        ],
        ac5eChanges: [
          DDBEnricherData.ChangeHelper.ac5eChange("once; 1", 20, "flags.automated-conditions-5e.attack.advantage"),
        ],
      },
    ];
  }

}
