/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class ShadowArmor extends DDBEnricherData {

  get effects() {
    return [
      {
        name: `${this.name}:Attack Disadvantage`,
        options: {
          durationSeconds: 1,
        },
        midiChanges: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("1", 20, "flags.midi-qol.grants.disadvantage.attack.all"),
        ],
        midiOnly: true,
        daeSpecialDurations: ["isAttacked"],
      },
      {
        name: `${this.name}: Radiant Resistance`,
        options: {
          durationSeconds: 6,
        },
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("radiant", 20, "system.traits.dr.value"),
        ],
        daeSpecialDurations: ["turnStart"],
      },
    ];
  }


}
