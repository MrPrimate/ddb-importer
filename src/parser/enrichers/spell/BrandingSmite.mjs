/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class BrandingSmite extends DDBEnricherData {

  get additionalActivities() {
    return this.is2014 && this.useMidiAutomations
      ? [
        {
          constructor: {
            name: "Cast (Automation)",
            type: "utility",
          },
          build: {
            generateConsumption: true,
            generateSave: false,
            generateDamage: false,
            generateHealing: false,
            generateRange: false,
            generateActivation: true,
          },
          overrides: {
            activationType: "bonus",

          },
        },
      ]
      : [];
  }

  get clearAutoEffects() {
    return this.is2014 && this.useMidiAutomations;
  }


  get effects() {
    return this.is2014 && this.useMidiAutomations
      ? [
        {
          name: `${this.data.name} (Automation)`,
          activityMatch: "Cast (Automation)",
          midiOnly: true,
          midiChanges: [
            DDBEnricherData.ChangeHelper.unsignedAddChange("@item.level", 20, "flags.midi-qol.brandingSmite.level"),
          ],
          damageBonusMacroChanges: [
            { macroType: "spell", macroName: "brandingSmite.js", document: this.data },
          ],
          options: {
            durationSeconds: 60,
          },
          data: {
            flags: {
              dae: {
                specialDurations: ["1Hit:rwak", "1Hit:mwak"],
                selfTarget: true,
                selfTargetAlways: true,
              },
            },
          },
        },
      ]
      : [];
  }

  get setMidiOnUseMacroFlag() {
    if (this.is2014) {
      return {
        type: "spell",
        name: "brandingSmite.js",
        triggerPoints: ["postActiveEffects"],
      };
    }
    return null;
  }

  get itemMacro() {
    if (this.is2014) {
      return {
        type: "spell",
        name: "brandingSmite.js",
      };
    }
    return null;
  }

}
