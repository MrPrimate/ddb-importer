import DDBEnricherData from "../data/DDBEnricherData";

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
        daeSpecialDurations: ["isAttacked" as const],
      },
      {
        name: `${this.name}: Radiant Resistance`,
        options: {
          durationSeconds: 6,
        },
        changes: [
          DDBEnricherData.ChangeHelper.damageResistanceChange("radiant"),
        ],
        daeSpecialDurations: ["turnStart" as const],
      },
    ];
  }


}
