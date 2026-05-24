import DDBEnricherData from "../data/DDBEnricherData";

export default class Sharpshooter extends DDBEnricherData {

  get effects(): IDDBEffectHint[] {
    const damageEffects: IDDBEffectHint[] = this.is2014
      ? [
        {
          name: "Sharpshooter Penalty/Bonus",
          options: {
            transfer: true,
            disabled: true,
            showIcon: 2,
          },
          changes: [
            DDBEnricherData.ChangeHelper.unsignedAddChange("-5", 30, "system.bonuses.rwak.attack"),
            DDBEnricherData.ChangeHelper.unsignedAddChange("+10", 30, "system.bonuses.rwak.damage"),
          ],
        },
      ]
      : [];

    const versionedChanges: IActiveEffectChangeData[] = this.is2014
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
          DDBEnricherData.ChangeHelper.unsignedAddChange("1", 30, "flags.dnd5e.sharpShooter"),
          DDBEnricherData.ChangeHelper.customChange("2", 30, "flags.dnd5e.helpersIgnoreCover"),
          ...versionedChanges,
        ],
      },
    ];
  }

  get override(): IDDBOverrideData {
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
