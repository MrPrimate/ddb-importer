import DDBEnricherData from "../data/DDBEnricherData";

export default class ViciousMockery extends DDBEnricherData {
  // get override(): IDDBOverrideData {
  //   return {
  //     data: {
  //       flags: {
  //         "midi-qol": {
  //           AoETargetType: "any",
  //           AoETargetTypeIncludeSelf: false,
  //         },
  //       },
  //     },
  //   };
  // }

  get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Vicious Mockery",
        options: {
          description: "Disadvantage on the next attack roll made before the end of the target's next turn.",
        },
        daeSpecialDurations: ["1Attack" as const, "turnEnd" as const],
      },
      {
        midiOnly: true,
        noCreate: true,
        midiChanges: [
          DDBEnricherData.ChangeHelper.overrideChange("1", 20, "flags.midi-qol.disadvantage.attack.all"),
        ],
        data: {
          duration: {
            turns: 2,
          },
        },
      },
    ];
  }

}
