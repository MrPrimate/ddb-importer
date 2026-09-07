import DDBEnricherData from "../data/DDBEnricherData";

export default class Befuddlement extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Befuddled",
        options: {
          description: "You can't cast spells or take the Magic action. At the end of every 30 days you repeat the save, ending the effect on a success. The effect can also be ended by the Greater Restoration, Heal, or Wish spell.",
        },
        midiChanges: [
          DDBEnricherData.ChangeHelper.overrideChange("1", 20, "flags.midi-qol.fail.spell.all"),
        ],
      },
    ];
  }

}
