import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Pacify Person: the parsed Wisdom save is kept. A pacified creature can't attack, cast a spell
 * that affects an enemy, or deal damage, none of which is expressible as a change, so the effect
 * tracks the condition through its description and the repeat save is driven by midi.
 */
export default class PacifyPerson extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Pacified",
        options: {
          durationSeconds: 60,
          description: "A pacified creature can't attack, cast a spell that affects an enemy, or deal damage to another creature. It can repeat the saving throw at the end of each of its turns, ending the effect on itself on a success.",
        },
        midiChanges: [
          DDBEnricherData.ChangeHelper.customChange(
            "label=Pacify Person (End of Turn Save),turn=end,saveDC=@attributes.spell.dc,saveAbility=wis,savingThrow=true,saveRemove=true,killAnim=true",
            20,
            "flags.midi-qol.OverTime",
          ),
        ],
      },
    ];
  }

}
