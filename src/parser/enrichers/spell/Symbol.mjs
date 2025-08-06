/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class Symbol extends DDBEnricherData {

  get data2014() {
    return [
      {
        name: "Death",
        save: "con",
        data: {
          damage: {
            number: 1,
            denomination: 10,
            type: "necrotic",
          },
        },
      },
      {
        name: "Discord",
        save: "con",
        effect: {
          changes: ["str", "dex", "con", "int", "wis", "cha"].map((ability) =>
            DDBEnricherData.ChangeHelper.unsignedAddChange(`${CONFIG.Dice.D20Roll.ADV_MODE.DISADVANTAGE}`, 20, `system.abilities.${ability}.check.roll.mode`),
          ),
          midiChanges: [
            DDBEnricherData.ChangeHelper.customChange("1", 20, "flags.midi-qol.disadvantage.attack.all"),
          ],
        },
      },
      {
        name: "Fear",
        save: "wis",
        effect: {
          statuses: ["Frightened"],
        },
      },
      {
        name: "Hopelessness",
        save: "cha",
      },
      {
        name: "Insanity",
        save: "int",
        effect: {
          statuses: ["Insane"],
        },
      },
      {
        name: "Pain",
        save: "con",
        effect: {
          statuses: ["Incapacitated"],
        },
      },
      {
        name: "Sleep",
        save: "wis",
        effect: {
          statuses: ["Unconscious"],
        },
      },
      {
        name: "Stunning",
        save: "wis",
        effect: {
          statuses: ["Stunned"],
        },
      },
    ];
  }

  get data2024() {
    return [
      {
        name: "Death",
        save: "con",
        data: {
          damage: {
            number: 1,
            denomination: 10,
            type: "necrotic",
          },
        },
      },
      {
        name: "Discord",
        save: "wis",
        effect: {
          changes: ["str", "dex", "con", "int", "wis", "cha"].map((ability) =>
            DDBEnricherData.ChangeHelper.unsignedAddChange(`${CONFIG.Dice.D20Roll.ADV_MODE.DISADVANTAGE}`, 20, `system.abilities.${ability}.check.roll.mode`),
          ),
          midiChanges: [
            DDBEnricherData.ChangeHelper.customChange("1", 20, "flags.midi-qol.disadvantage.attack.all"),
          ],
        },
      },
      {
        name: "Fear",
        save: "wis",
        effect: {
          statuses: ["Frightened"],
        },
      },
      {
        name: "Pain",
        save: "con",
        effect: {
          statuses: ["Incapacitated"],
        },
      },
      {
        name: "Sleep",
        save: "wis",
        effect: {
          statuses: ["Unconscious"],
        },
      },
      {
        name: "Stunning",
        save: "wis",
        effect: {
          statuses: ["Stunned"],
        },
      },
    ];
  }

  get type() {
    return "utility";
  }

  get additionalActivities() {
    return (this.is2014 ? this.data2014 : this.data2024).map((symbol) => {
      return {
        constructor: {
          name: symbol.name,
          type: "save",
        },
        build: {
          generateSave: true,
          generateEffect: true,
          saveOverride: {
            ability: [symbol.save],
            dc: {
              formula: "",
              calculation: "spellcasting",
            },
          },
        },
        overrides: {
          noSpellslot: true,
          data: symbol.data ?? {},
          targetOverride: true,
          targetType: "creature",
        },
      };
    });
  }

  get effects() {
    return (this.is2014 ? this.data2014 : this.data2024).map((symbol) => {
      return foundry.utils.mergeObject({
        name: symbol.name,
      }, symbol.effect ?? {});
    });
  }

}

