/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class ThunderousSmite extends DDBEnricherData {

  get type() {
    return "damage";
  }

  get activity() {
    return {
      noeffect: true,
      allowCritical: true,
      data: {
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({
              number: 2,
              denomination: 6,
              types: ["thunder"],
              scalingMode: "whole",
              scalingNumber: 1,
            }),
          ],
        },
      },
    };
  }

  get additionalActivities() {
    const activities = [
      {
        constructor: {
          name: "Save vs Pushed",
          type: "save",
        },
        build: {
          generateConsumption: true,
          generateSave: false,
          generateDamage: false,
          generateRange: true,
        },
      },
    ];
    if (this.is2014 && this.useMidiAutomations) {
      activities.push({
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
      });
    }

    return activities;
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
            DDBEnricherData.ChangeHelper.unsignedAddChange("@attributes.spell.dc", 20, "flags.midi-qol.thunderousSmite.dc"),
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
