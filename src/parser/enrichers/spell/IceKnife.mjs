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
      data: {
        midiProperties: {
          triggeredActivityId: "addSaveVsBlasDam",
          triggeredActivityTargets: "retarget",
          triggeredActivityRollAs: "self",
          triggeredActivityConditionText: "true",
        },
      },
    };
  }

  get additionalActivities() {
    return [
      {
        constructor: {
          name: "Save vs Blast Damage",
          type: "save",
          id: "addSaveVsBlasDam",
        },
        build: {
          generateSave: true,
          generateDamage: true,
          generateConsumption: false,
          generateActivation: true,
          generateTargets: true,
          noSpellslot: true,
          damageParts: [
            DDBEnricherData.basicDamagePart({
              number: 2,
              denomination: 6,
              types: ["cold"],
              scalingMode: "whole",
              scalingNumber: "1",
            }),
          ],
        },
        overrides: {
          activationType: "special",
          overrideActivation: true,
          overrideTarget: true,
          data: {
            midiProperties: {
              confirmTargets: "always",
            },
            target: {
              affects: {
                type: "creature",
              },
              template: {
                type: "radius",
                size: "5",
                units: "ft",
              },
            },
          },
        },
      },
    ];
  }

  // get itemMacro() {
  //   return {
  //     type: "spell",
  //     name: "iceKnife.js",
  //   };
  // }

  // get setMidiOnUseMacroFlag() {
  //   return {
  //     type: "spell",
  //     name: "iceKnife.js",
  //     triggerPoints: ["postActiveEffects"],
  //   };
  // }
}
