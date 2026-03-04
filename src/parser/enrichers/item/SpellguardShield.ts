import DDBEnricherData from "../data/DDBEnricherData";

export default class SpellguardShield extends DDBEnricherData {

  get effects(): IDDBEffectHint[] {
    return [
      {
        noCreate: true,
        midiChanges: [
          DDBEnricherData.ChangeHelper.customChange(1, 20, "flags.midi-qol.grants.disadvantage.attack.msak"),
          DDBEnricherData.ChangeHelper.customChange(1, 20, "flags.midi-qol.grants.disadvantage.attack.rsak"),
        ],
      },
    ];
  }
}
