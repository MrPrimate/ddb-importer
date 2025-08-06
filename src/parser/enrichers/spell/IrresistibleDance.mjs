/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class IrresistibleDance extends DDBEnricherData {

  get type() {
    return this.is2014 ? "utility" : "none";
  }

  get activity() {
    return {
      name: "Cast",
    };
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
          generateDamage: false,
          generateTarget: true,
          generateActivation: true,
          noSpellslot: this.is2014,
        },
        overrides: {
          data: {
            activation: {
              override: this.is2014,
              type: "special",
            },
          },
        },
      },
    ];
  }

  get clearAutoEffects() {
    return true;
  }

  get effects2014() {
    return [
      {
        name: "Comic Dancing",
        activityMatch: "Cast",
        macroChanges: [
          { macroType: "spell", macroName: "irresistibleDance.js" },
        ],
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange(`${CONFIG.Dice.D20Roll.ADV_MODE.DISADVANTAGE}`, 20, `system.abilities.dex.save.roll.mode`),
        ],
        midiChanges: [
          DDBEnricherData.ChangeHelper.customChange("1", 20, "flags.midi-qol.disadvantage.attack.all"),
          DDBEnricherData.ChangeHelper.customChange("1", 20, "flags.midi-qol.grants.advantage.attack.all"),
        ],
        data: {
          flags: {
            dae: {
              macroRepeat: "startEveryTurn",
            },
          },
        },
      },
    ];
  }

  get effects2024() {
    return [
      {
        name: "Comic Dancing",
        options: {
          durationSeconds: 6,
        },
        data: {
          flags: {
            dae: {
              specialDuration: ["turnEnd"],
            },
          },
        },
      },
      {
        name: `Comic Dancing and Charmed`,
        macroChanges: [
          { macroType: "spell", macroName: "irresistibleDance.js" },
        ],
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange(`${CONFIG.Dice.D20Roll.ADV_MODE.DISADVANTAGE}`, 20, `system.abilities.dex.save.roll.mode`),
        ],
        midiChanges: [
          DDBEnricherData.ChangeHelper.customChange("1", 20, "flags.midi-qol.disadvantage.attack.all"),
          DDBEnricherData.ChangeHelper.customChange("1", 20, "flags.midi-qol.grants.advantage.attack.all"),
        ],
        data: {
          flags: {
            dae: {
              macroRepeat: "startEveryTurn",
            },
          },
        },
      },
    ];
  }

  get effects() {
    return this.is2014 ? this.effects2014 : this.effects2024;
  }

  get itemMacro() {
    return {
      type: "spell",
      name: "irresistibleDance.js",
    };
  }

}
