/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class AspectOfTheBeastBear extends DDBEnricherData {

  get effects() {
    return [
      {
        options: {
          transfer: true,
        },
        changes: [
          DDBEnricherData.ChangeHelper.overrideChange("@attributes.encumbrance.max * 2", 20, "system.attributes.encumbrance.max"),
        ],
        daeChanges: [
          DDBEnricherData.ChangeHelper.overrideChange("dae.eval(100 * attributes.encumbrance.value / attributes.encumbrance.max)", 20, "system.attributes.encumbrance.pct"),
        ],
        midiChanges: [
          DDBEnricherData.ChangeHelper.customChange("1", 20, "flags.midi-qol.advantage.ability.save.str"),
        ],
      },
    ];
  }

}
