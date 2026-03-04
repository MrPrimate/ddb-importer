import DDBEnricherData from "../data/DDBEnricherData";

export default class BrandingSmite extends DDBEnricherData {

  get activity() {
    return {
      data: {
        damage: {
          critical: {
            allow: true,
          },
        },
      },
    };
  }

  get additionalActivities(): IDDBAdditionalActivity[] {
    return this.is2014 && this.useMidiAutomations
      ? [
        {
          init: {
            name: "Cast (Automation)",
            type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
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
