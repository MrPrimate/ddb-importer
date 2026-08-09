import DDBEnricherData from "../data/DDBEnricherData";

export default class HailOfThorns extends DDBEnricherData {
  override get type(): IDDBActivityType | null {
    return this.is2014 ? DDBEnricherData.ACTIVITY_TYPES.UTILITY : DDBEnricherData.ACTIVITY_TYPES.NONE;
  }

  override get activity(): IDDBActivityData | null {
    if (this.is2014) {
      return {
        name: "Cast",
        noTemplate: true,
        overrideTarget: true,
        overrideRange: true,
        rangeSelf: true,
        targetType: "self",
      };
    }
    return null;
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Save",
          type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
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

  override get override(): IDDBOverrideData {
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

  override get effects(): IDDBEffectHint[] {
    if (!this.is2014) return [];

    return [
      {
        name: "Hail of Thorns",
        onUseMacroChanges: [
          { macroPass: "postActiveEffects", macroType: "spell", macroName: "hailOfThorns.js", document: this.data },
        ],
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

  override get itemMacro(): IDDBItemMacro {
    return {
      type: "spell",
      name: "hailOfThorns.js",
    };
  }

  // get setMidiOnUseMacroFlag(): IDDBSetMidiOnUseMacroFlag {
  //   return {
  //     type: "spell",
  //     name: "hailOfThorns.js",
  //     triggerPoints: ["postActiveEffects"],
  //   };
  // }
}
