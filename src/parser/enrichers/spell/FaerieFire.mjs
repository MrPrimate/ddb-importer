/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class FaerieFire extends DDBEnricherData {

  get effects() {
    return [
      { colour: "Blue", hex: "#5ab9e2" },
      { colour: "Green", hex: "#55d553" },
      { colour: "Violet", hex: "#844ec6" },
    ].map((data) => {
      return {
        name: `${data.colour} Light`,
        midiChanges: [
          DDBEnricherData.generateCustomChange("1", 20, "flags.midi-qol.grants.advantage.attack.all"),
        ],
        atlChanges: [
          DDBEnricherData.generateOverrideChange(data.hex, 30, "ATL.light.color"),
          DDBEnricherData.generateOverrideChange("0.65", 30, "ATL.light.alpha"),
          DDBEnricherData.generateOverrideChange("10", 30, "ATL.light.dim"),
          DDBEnricherData.generateOverrideChange('{"type": "pulse","speed": 1,"intensity": 3}', 30, "ATL.light.animation"),
        ],
        tokenMagicChanges: [
          DDBEnricherData.generateTokenMagicFXChange("glow"),
        ],
      };
    });
  }

}
