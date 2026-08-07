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
        daeSpecialDurations: ["1Attack", "turnEnd"],
        ac5eChanges: [
          DDBEnricherData.ChangeHelper.customChange("once; 1", 20, "flags.automated-conditions-5e.attack.disadvantage"),
        ],
      },
      {
        midiOnly: true,
        noCreate: true,
        midiChanges: [
          DDBEnricherData.ChangeHelper.overrideChange("1", 20, "flags.midi-qol.disadvantage.attack.all"),
        ],
        data: {
          duration: {
            value: 6,
            expiry: "turnEnd",
            units: "seconds",
          },
        },
      },
    ];
  }

}
