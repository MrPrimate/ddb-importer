/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../../DDBEnricherMixin.js";

export default class Rage extends DDBEnricherMixin {

  get activity() {
    return {
      targetType: "self",
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
        DDBEnricherMixin.generateUnsignedAddChange("@scale.barbarian.rage-damage", 20, "system.bonuses.mwak.damage"),
        DDBEnricherMixin.generateUnsignedAddChange("piercing", 20, "system.traits.dr.value"),
        DDBEnricherMixin.generateUnsignedAddChange("slashing", 20, "system.traits.dr.value"),
        DDBEnricherMixin.generateUnsignedAddChange("bludgeoning", 20, "system.traits.dr.value"),
      ],
      midiChanges: [
        DDBEnricherMixin.generateCustomChange("1", 20, "flags.midi-qol.advantage.ability.save.str"),
        DDBEnricherMixin.generateCustomChange("1", 20, "flags.midi-qol.advantage.ability.check.str"),
      ],
      tokenMagicChanges: [
        DDBEnricherMixin.generateCustomChange("outline", 20, "macro.tokenMagic"),
      ],
    }];
  }

}
