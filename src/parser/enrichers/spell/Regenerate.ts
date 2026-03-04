import DDBEnricherData from "../data/DDBEnricherData";

export default class Regenerate extends DDBEnricherData {

  get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Regenerating",
        midiChanges: [
          DDBEnricherData.ChangeHelper.overrideChange(
            `label=${this.data.name} (Start of Turn),killAnim=true,turn=end,damageRoll=1,damageType=healing,condition=@attributes.hp.value > 0 && @attributes.hp.value < @attributes.hp.max`,
            20,
            "flags.midi-qol.OverTime",
          ),
        ],
      },
    ];
  }
}
