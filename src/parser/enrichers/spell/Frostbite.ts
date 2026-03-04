import DDBEnricherData from "../data/DDBEnricherData";

export default class Frostbite extends DDBEnricherData {

  get effects(): IDDBEffectHint[] {
    return [
      {
        noCreate: true,
        name: `Frostbitten`,
        options: {
          durationRounds: 2,
          description: "The target has disadvantage on the next weapon attack roll it makes before the end of its next turn.",
        },
        midiChanges: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("1", 20, "flags.midi-qol.disadvantage.attack.mwak"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("1", 20, "flags.midi-qol.disadvantage.attack.rwak"),
        ],
        daeSpecialDurations: ["1Attack:rwak" as const, "1Attack:mwak" as const, "turnEnd" as const],
      },
    ];
  }

}
