/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class ViciousMockery extends DDBEnricherData {
  // get override() {
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

  get effects() {
    return [
      {
        name: "Vicious Mockery",
        daeSpecialDurations: ["1Attack", "turnEnd"],
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
