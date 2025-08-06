/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class Rage extends DDBEnricherData {

  get activity() {
    return {
      targetType: "self",
      addItemConsume: true,
      data: {
        "range.units": "self",
        duration: this.is2014
          ? { units: "second", value: "60" }
          : { units: "minute", value: "10" },
      },
    };
  }

  get additionalActivities() {
    return [
    ];
  }

  get override() {
    return {
      data: {
        name: "Rage",
        "system.uses": {
          max: "@scale.barbarian.rages",
          recovery: this.is2014
            ? [{ period: "lr", type: 'recoverAll', formula: "" }]
            : [
              { period: "lr", type: 'recoverAll', formula: "" },
              { period: "sr", type: 'formula', formula: "1" },
            ],
        },
      },
    };
  }

  get effects() {
    return [{
      name: "Rage",
      options: {
        // transfer: true,
        // disabled: true,
        durationSeconds: this.is2014 ? 60 : 600,
      },
      changes: [
        DDBEnricherData.ChangeHelper.unsignedAddChange("@scale.barbarian.rage-damage", 20, "system.bonuses.mwak.damage"),
        DDBEnricherData.ChangeHelper.unsignedAddChange("piercing", 20, "system.traits.dr.value"),
        DDBEnricherData.ChangeHelper.unsignedAddChange("slashing", 20, "system.traits.dr.value"),
        DDBEnricherData.ChangeHelper.unsignedAddChange("bludgeoning", 20, "system.traits.dr.value"),
        DDBEnricherData.ChangeHelper.unsignedAddChange(`${CONFIG.Dice.D20Roll.ADV_MODE.ADVANTAGE}`, 20, "system.abilities.str.save.roll.mode"),
        DDBEnricherData.ChangeHelper.unsignedAddChange(`${CONFIG.Dice.D20Roll.ADV_MODE.ADVANTAGE}`, 20, "system.abilities.str.check.roll.mode"),
      ],
      tokenMagicChanges: [
        DDBEnricherData.ChangeHelper.customChange("outline", 20, "macro.tokenMagic"),
      ],
    }];
  }

}
