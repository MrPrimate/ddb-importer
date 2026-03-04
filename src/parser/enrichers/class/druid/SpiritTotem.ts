import DDBEnricherData from "../../data/DDBEnricherData";

export default class SpiritTotem extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.NONE;
  }

  get additionalActivities(): IDDBAdditionalActivity[] {
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
              value: "",
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
              value: "",
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
              value: "",
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
              value: "1",
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

  get effects() {
    return [
      {
        name: "Bear Totem",
        activityMatch: "Bear Totem",
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange(`${CONFIG.Dice.D20Roll.ADV_MODE.ADVANTAGE}`, 20, "system.abilities.str.save.roll.mode"),
          DDBEnricherData.ChangeHelper.unsignedAddChange(`${CONFIG.Dice.D20Roll.ADV_MODE.ADVANTAGE}`, 20, "system.abilities.str.check.roll.mode"),
        ],
        midiNever: true,
      },
      {
        name: "Bear Totem Aura",
        activityMatch: "Bear Totem",
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange(`${CONFIG.Dice.D20Roll.ADV_MODE.ADVANTAGE}`, 20, "system.abilities.str.save.roll.mode"),
          DDBEnricherData.ChangeHelper.unsignedAddChange(`${CONFIG.Dice.D20Roll.ADV_MODE.ADVANTAGE}`, 20, "system.abilities.str.check.roll.mode"),
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
          DDBEnricherData.ChangeHelper.unsignedAddChange(`${CONFIG.Dice.D20Roll.ADV_MODE.ADVANTAGE}`, 20, "system.skills.prc.roll.mode"),
        ],
        midiNever: true,
      },
      {
        name: "Hawk Spirit Aura",
        activityMatch: "Hawk Spirit",
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange(`${CONFIG.Dice.D20Roll.ADV_MODE.ADVANTAGE}`, 20, "system.skills.prc.roll.mode"),
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

  get setMidiOnUseMacroFlag() {
    return {
      type: "generic",
      name: "activeAuraOnly.js",
      triggerPoints: ["preActiveEffects"],
    };
  }

  get itemMacro() {
    return {
      type: "generic",
      name: "activeAuraOnly.js",
    };
  }

}
