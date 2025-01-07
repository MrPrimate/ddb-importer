/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class IceKnife extends DDBEnricherData {

  get type() {
    return "attack";
  }

  get activity() {
    return {
      name: "Attack",
      targetType: "creature",
      overrideTemplate: true,
      noTemplate: true,
    };
  }

  get additionalActivities() {
    return [
      {
        constructor: {
          name: "Save vs Blast Damage",
          type: "save",
        },
        build: {
          generateSave: true,
          generateDamage: true,
          generateConsumption: false,
          generateActivation: true,
          noSpellslot: true,
          damageParts: [
            DDBEnricherData.basicDamagePart({
              number: 2,
              denomination: 6,
              types: ["cold"],
              scalingMode: "whole",
              scalingFormula: "1d6",
            }),
          ],
        },
        overrides: {
          activationType: "special",
          overrideActivation: true,
        },
      },
    ];
  }


  get itemMacro() {
    return {
      type: "spell",
      name: "iceKnife.js",
    };
  }

  get setMidiOnUseMacroFlag() {
    return {
      type: "spell",
      name: "iceKnife.js",
      triggerPoints: ["postActiveEffects"],
    };
  }

}
