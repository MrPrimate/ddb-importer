import DDBEnricherData from "../../data/DDBEnricherData";

export default class SpiritTotem extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.NONE;
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Bear Totem",
          type: DDBEnricherData.ACTIVITY_TYPES.HEAL,
        },
        build: {
          generateConsumption: true,
          generateTarget: true,
          generateHealing: true,
          generateActivation: true,
          generateRange: true,
          targetOverride: {
            affects: {
              count: "",
              type: "ally",
            },
            template: {
              contiguous: false,
              type: "radius",
              size: "30",
              units: "ft",
            },
          },
          rangeOverride: {
            value: "60",
            units: "ft",
          },
          healingPart: DDBEnricherData.basicDamagePart({
            customFormula: "5+@classes.druid.levels",
            type: "temphp",
          }),
        },
      },
      {
        init: {
          name: "Hawk Spirit",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          generateConsumption: true,
          generateTarget: true,
          generateHealing: true,
          generateActivation: true,
          generateRange: true,
          targetOverride: {
            affects: {
              count: "",
              type: "ally",
            },
            template: {
              contiguous: false,
              type: "radius",
              size: "30",
              units: "ft",
            },
          },
          rangeOverride: {
            value: "60",
            units: "ft",
          },
        },
      },
      {
        init: {
          name: "Unicorn Spirit",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          generateConsumption: true,
          generateTarget: true,
          generateHealing: true,
          generateActivation: true,
          generateRange: true,
          targetOverride: {
            affects: {
              count: "",
              type: "ally",
            },
            template: {
              contiguous: false,
              type: "radius",
              size: "30",
              units: "ft",
            },
          },
          rangeOverride: {
            value: "60",
            units: "ft",
          },
        },
      },
      {
        init: {
          name: "Unicorn Spirit: Bonus Healing",
          type: DDBEnricherData.ACTIVITY_TYPES.HEAL,
        },
        build: {
          generateConsumption: false,
          generateTarget: true,
          generateHealing: true,
          generateActivation: true,
          generateRange: true,
          targetOverride: {
            affects: {
              count: "1",
              type: "ally",
            },
          },
          rangeOverride: {
            value: "60",
            units: "ft",
          },
          healingPart: DDBEnricherData.basicDamagePart({
            customFormula: "@classes.druid.levels",
            type: "healing",
          }),
        },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Bear Totem",
        activityMatch: "Bear Totem",
        changes: [
          DDBEnricherData.ChangeHelper.advantageAbilitySaveChange("str"),
          DDBEnricherData.ChangeHelper.advantageAbilityCheckChange("str"),
        ],
        midiNever: true,
      },
      {
        name: "Bear Totem Aura",
        activityMatch: "Bear Totem",
        changes: [
          DDBEnricherData.ChangeHelper.advantageAbilitySaveChange("str"),
          DDBEnricherData.ChangeHelper.advantageAbilityCheckChange("str"),
        ],
        midiOnly: true,
        data: {
          flags: {
            ActiveAuras: {
              aura: "Allies",
              radius: "30",
              isAura: true,
              ignoreSelf: false,
              inactive: false,
              hidden: false,
              displayTemp: true,
            },
          },
        },
      },
      {
        name: "Hawk Spirit",
        activityMatch: "Hawk Spirit",
        changes: [
          DDBEnricherData.ChangeHelper.advantageSkillChange("prc"),
        ],
        midiNever: true,
      },
      {
        name: "Hawk Spirit Aura",
        activityMatch: "Hawk Spirit",
        changes: [
          DDBEnricherData.ChangeHelper.advantageSkillChange("prc"),
        ],
        midiOnly: true,
        data: {
          flags: {
            ActiveAuras: {
              aura: "Allies",
              radius: "30",
              isAura: true,
              ignoreSelf: false,
              inactive: false,
              hidden: false,
              displayTemp: true,
            },
          },
        },
      },
      {
        name: "Unicorn Spirit",
        activityMatch: "Unicorn Spirit",
        midiNever: true,
      },
      {
        name: "Unicorn Spirit Aura",
        activityMatch: "Unicorn Spirit",
        midiOnly: true,
        data: {
          flags: {
            ActiveAuras: {
              aura: "Allies",
              radius: "30",
              isAura: true,
              ignoreSelf: false,
              inactive: false,
              hidden: false,
              displayTemp: true,
            },
          },
        },
      },
    ];
  }

  override get setMidiOnUseMacroFlag(): IDDBSetMidiOnUseMacroFlag {
    return {
      type: "generic",
      name: "activeAuraOnly.js",
      triggerPoints: ["preActiveEffects"],
    };
  }

  override get itemMacro(): IDDBItemMacro {
    return {
      type: "generic",
      name: "activeAuraOnly.js",
    };
  }

}
