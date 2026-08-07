import DDBEnricherData from "../data/DDBEnricherData";

/**
 * A pacified creature can't attack, cast a spell that affects an enemy, or deal
 * damage. None of that is expressible as a change, so the effect carries the
 * restrictions as its description and the repeat save is driven by midi.
 */
export default class PacifyMonster extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  get activity(): IDDBActivityData {
    return {
      targetType: "creature",
      targetCount: 1,
      data: {
        save: {
          ability: ["wis"],
          dc: {
            calculation: "spellcasting",
            formula: "",
          },
        },
        damage: {
          onSave: "none",
        },
      },
    };
  }

  get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Pacified",
        options: {
          description: "You can't attack, cast a spell that affects an enemy, or deal damage to another creature. You can repeat the saving throw at the end of each of your turns, ending the effect on yourself on a success.",
        },
        midiChanges: [
          DDBEnricherData.ChangeHelper.customChange(
            "label=Pacify Monster (End of Turn Save),turn=end,saveDC=@attributes.spell.dc,saveAbility=wis,savingThrow=true,saveRemove=true,killAnim=true",
            20,
            "flags.midi-qol.OverTime",
          ),
        ],
      },
    ];
  }

}
