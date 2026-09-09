import DDBEnricherData from "../data/DDBEnricherData";

export default class BlindingSmite extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
    // Both rulesets: the blinded target makes a Constitution saving throw at
    // the end of each of its turns, ending the spell on itself on a success.
    return [
      {
        // merge into the auto-generated Blinded effect rather than creating a
        // second one
        noCreate: true,
        midiOnly: true,
        midiChanges: [
          DDBEnricherData.ChangeHelper.customChange(
            "label=Blinding Smite (End of Turn Save),turn=end,saveDC=@attributes.spell.dc,saveAbility=con,savingThrow=true,saveRemove=true,killAnim=true",
            20,
            "flags.midi-qol.OverTime",
          ),
        ],
      },
    ];
  }

}
