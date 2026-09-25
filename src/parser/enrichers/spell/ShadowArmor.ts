import DDBEnricherData from "../data/DDBEnricherData";

export default class ShadowArmor extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
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
          // "you have resistance to radiant damage until the start of your next turn"
          expiry: "sourceStart",
        },
        changes: [
          DDBEnricherData.ChangeHelper.damageResistanceChange("radiant"),
        ],
      },
    ];
  }


}
