/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class ThunderousSmite extends DDBEnricherData {

  get additionalActivities() {
    return this.is2014 && DDBEnricherData.AutoEffects.effectModules().midiQolInstalled
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
    return this.is2014 && DDBEnricherData.AutoEffects.effectModules().midiQolInstalled;
  }


  get effects() {
    return this.is2014 && DDBEnricherData.AutoEffects.effectModules().midiQolInstalled
      ? [
        {
          name: `${this.data.name} (Automation)`,
          activityMatch: "Cast (Automation)",
          midiOnly: true,
          midiChanges: [
            DDBEnricherData.ChangeHelper.unsignedAddChange("@attributes.spelldc", 20, "flags.midi-qol.thunderousSmite.dc"),
          ],
          damageBonusMacroChanges: [
            { macroType: "spell", macroName: "thunderousSmite.js", document: this.data },
          ],
          options: {
            durationSeconds: 60,
          },
          data: {
            flags: {
              dae: {
                specialDurations: ["1Hit:mwak"],
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
        name: "thunderousSmite.js",
        triggerPoints: ["postActiveEffects", "preTargeting"],
      };
    }
    return null;
  }

  get itemMacro() {
    if (this.is2014) {
      return {
        type: "spell",
        name: "thunderousSmite.js",
      };
    }
    return null;
  }

}
