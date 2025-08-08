/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class SpiritTotem extends DDBEnricherData {

  get type() {
    return "none";
  }

  get additionalActivities() {
    return [
      {
        constructor: {
          name: "Bear Totem",
          type: "heal",
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
          },
          healingPart: DDBEnricherData.basicDamagePart({
            customFormula: "5+@classes.druid.levels",
            type: "temphp",
          }),
        },
      },
      {
        constructor: {
          name: "Hawk Spirit",
          type: "utility",
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
          },
        },
      },
      {
        constructor: {
          name: "Unicorn Spirit",
          type: "utility",
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
          },
        },
      },
      {
        constructor: {
          name: "Unicorn Spirit: Bonus Healing",
          type: "heal",
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
        changes: [],
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
