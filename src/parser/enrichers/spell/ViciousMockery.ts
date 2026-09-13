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

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Vicious Mockery",
        options: {
          expiry: "targetEnd",
          description: "Disadvantage on the next attack roll made before the end of the target's next turn. Without DAE or AC5e the effect lasts for every attack until then.",
        },
        // DAE and AC5e each end the effect after the one attack; the native expiry is the ceiling
        daeSpecialDurations: ["1Attack"],
        changes: [
          DDBEnricherData.ChangeHelper.ruleDisadvantageChange("attack"),
        ],
        ac5eChanges: [
          DDBEnricherData.ChangeHelper.ac5eChange("once; 1", 20, "flags.automated-conditions-5e.attack.disadvantage"),
        ],
      },
    ];
  }

}
