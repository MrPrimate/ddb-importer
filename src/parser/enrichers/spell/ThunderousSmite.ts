import DDBEnricherData from "../data/DDBEnricherData";

export default class ThunderousSmite extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
  }

  override get activity(): IDDBActivityData {
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

  override get additionalActivities(): IDDBAdditionalActivity[] {
    const activities: IDDBAdditionalActivity[] = [
      {
        init: {
          name: "Save vs Pushed",
          type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
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
      });
    }

    return activities;
  }

  override get clearAutoEffects(): boolean {
    return this.is2014 && this.useMidiAutomations;
  }


  override get effects(): IDDBEffectHint[] {
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
          daeSpecialDurations: ["1Hit:mwak"],
          data: {
            flags: {
              dae: {
                selfTarget: true,
                selfTargetAlways: true,
              },
            },
          },
        },
      ]
      : [];
  }

  override get setMidiOnUseMacroFlag(): IDDBSetMidiOnUseMacroFlag | null {
    if (this.is2014) {
      return {
        type: "spell",
        name: "thunderousSmite.js",
        triggerPoints: ["postActiveEffects", "preTargeting"],
      };
    }
    return null;
  }

  override get itemMacro(): IDDBItemMacro | null {
    if (this.is2014) {
      return {
        type: "spell",
        name: "thunderousSmite.js",
      };
    }
    return null;
  }

}
