import DDBEnricherData from "../data/DDBEnricherData";

export default class GuidingBolt extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: `Glittering`,
        options: {
          durationSeconds: 6,
          durationRounds: 1,
        },
        daeSpecialDurations: ["isAttacked", "turnEndSource"],
        midiChanges: [
          DDBEnricherData.ChangeHelper.overrideChange("1", 20, "flags.midi-qol.grants.advantage.attack.all"),
        ],
      },
    ];
  }

}
