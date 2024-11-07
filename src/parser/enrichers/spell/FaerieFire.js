/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../mixins/DDBEnricherMixin.mjs";

export default class FaerieFire extends DDBEnricherMixin {

  get effects() {
    return [
      { colour: "Blue", hex: "#5ab9e2" },
      { colour: "Green", hex: "#55d553" },
      { colour: "Violet", hex: "#844ec6" },
    ].map((data) => {
      return {
        name: `${data.colour} Light`,
        midiChanges: [
          DDBEnricherMixin.generateCustomChange("1", 20, "flags.midi-qol.grants.advantage.attack.all"),
        ],
        atlChanges: [
          DDBEnricherMixin.generateOverrideChange(data.hex, 30, "ATL.light.color"),
          DDBEnricherMixin.generateOverrideChange("0.65", 30, "ATL.light.alpha"),
          DDBEnricherMixin.generateOverrideChange("10", 30, "ATL.light.dim"),
          DDBEnricherMixin.generateOverrideChange('{"type": "pulse","speed": 1,"intensity": 3}', 30, "ATL.light.animation"),
        ],
        tokenMagicChanges: [
          DDBEnricherMixin.generateTokenMagicFXChange("glow"),
        ],
      };
    });
  }

}
