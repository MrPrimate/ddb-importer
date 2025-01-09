/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class HailOfThorns extends DDBEnricherData {
  get type() {
    return this.is2014 ? "utility" : "none";
  }

  get activity() {
    if (this.is2014) {
      return {
        name: "Cast",
        noTemplate: true,
      };
    }
    return null;
  }

  get additionalActivities() {
    return [
      {
        constructor: {
          name: "Save",
          type: "save",
        },
        build: {
          generateSave: true,
          generateDamage: true,
          generateConsumption: this.is2014,
          generateActivation: this.is2014,
          noSpellslot: this.is2014,
          generateDuration: this.is2014,
          durationOverride: {
            concentration: false,
            override: true,
            units: "inst",
          },
        },
        overrides: {
          activationType: this.is2014 ? "special" : "bonus",
          overrideActivation: this.is2014,
        },
      },
    ];
  }

  get override() {
    return {
      data: {
        system: {
          range: {
            units: "spec",
          },
          target: {
            affects: {
              type: "creature",
              choice: false,
            },
            template: {
              count: "",
              contiguous: false,
              type: "radius",
              size: "5",
              width: "",
              height: "",
              units: "ft",
            },
          },
        },
      },
    };
  }

  get effects() {
    if (!this.is2014) return [];

    return [
      {
        name: "Hail of Thorns",
        // onUseMacroChanges: [
        //   { macroPass: "postActiveEffects", macroType: "spell", macroName: "hailOfThorns.js", document: this.data },
        // ],
        data: {
          flags: {
            dae: {
              selfTarget: true,
              selfTargetAlways: true,
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
