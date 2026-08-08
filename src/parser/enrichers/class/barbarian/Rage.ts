import DDBEnricherData from "../../data/DDBEnricherData";

export default class Rage extends DDBEnricherData {

  get activity(): IDDBActivityData {
    return {
      targetType: "self",
      addItemConsume: true,
      data: {
        range: {
          units: "self",
        },
        duration: this.is2014
          ? { units: "minute", value: "1" }
          : { units: "minute", value: "10" },
      },
    };
  }

  get additionalActivities(): IDDBAdditionalActivity[] {
    return [
    ];
  }

  get override(): IDDBOverrideData {
    return {
      uses: {
        max: "@scale.barbarian.rages",
        recovery: this.is2014
          ? [{ period: "lr", type: "recoverAll", formula: "" }]
          : [
            { period: "lr", type: "recoverAll", formula: "" },
            { period: "sr", type: "formula", formula: "1" },
          ],
      },
      data: {
        name: "Rage",
      },
    };
  }

  get effects(): IDDBEffectHint[] {
    return [{
      name: "Rage",
      ignoreTransfer: true,
      options: {
        transfer: true,
        disabled: true,
        durationSeconds: this.is2014 ? 60 : 600,
      },
      changes: [
        DDBEnricherData.ChangeHelper.unsignedAddChange("@scale.barbarian.rage-damage", 20, "system.bonuses.mwak.damage"),
        DDBEnricherData.ChangeHelper.damageResistanceChange("piercing"),
        DDBEnricherData.ChangeHelper.damageResistanceChange("slashing"),
        DDBEnricherData.ChangeHelper.damageResistanceChange("bludgeoning"),
        DDBEnricherData.ChangeHelper.advantageAbilitySaveChange("str"),
        DDBEnricherData.ChangeHelper.advantageAbilityCheckChange("str"),
      ],
      tokenMagicChanges: [
        DDBEnricherData.ChangeHelper.customChange("outline", 20, "macro.tokenMagic"),
      ],
    }];
  }

}
