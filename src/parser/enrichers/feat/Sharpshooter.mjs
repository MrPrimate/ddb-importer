/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class Sharpshooter extends DDBEnricherData {

  get effects() {
    const damageEffects = this.is2014
      ? [
        {
          name: "Sharpshooter Penalty/Bonus",
          options: {
            transfer: true,
            disabled: true,
          },
          changes: [
            DDBEnricherData.ChangeHelper.unsignedAddChange("-5", 30, "system.bonuses.rwak.attack"),
            DDBEnricherData.ChangeHelper.unsignedAddChange("+10", 30, "system.bonuses.rwak.damage"),
          ],
          data: {
            flags: {
              dae: {
                showIcon: true,
              },
            },
          },
        },
      ]
      : [];

    const versionedChanges = this.is2014
      ? []
      : [
        DDBEnricherData.ChangeHelper.unsignedAddChange("1", 20, "flags.midi-qol.ignoreNearbyFoes"),
      ];

    return [
      ...damageEffects,
      {
        name: "Sharpshooter Passives",
        midiOnly: true,
        options: {
          transfer: true,
        },
        midiChanges: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("1", 30, "flags.midi-qol.sharpShooter"),
          DDBEnricherData.ChangeHelper.customChange("2", 30, "flags.dnd5e.helpersIgnoreCover"),
          ...versionedChanges,
        ],
      },
    ];
  }

  get override() {
    return {
      data: {
        flags: {
          "midi-qol": {
            effectActivation: false,
            removeAttackDamageButtons: false,
          },
          midiProperties: {
            toggleEffect: true,
          },
        },
      },
    };
  }

}
