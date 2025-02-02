/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class EnhanceAbility extends DDBEnricherData {

  get type() {
    return "none";
  }


  get additionalActivities() {
    return [
      { ability: "str", name2014: "Bull's Strength" },
      { ability: "con", name2014: "Bear's Endurance", type: "heal" },
      { ability: "dex", name2014: "Cat's Grace" },
      { ability: "int", name2014: "Fox's Cunning" },
      { ability: "wis", name2014: "Owl's Wisdom" },
      { ability: "cha", name2014: "Eagle's Splendor" },
    ]
      .filter((data) => this.is2014 || (!this.is2014 && data.ability !== "con"))
      .map((data) => {
        return {
          constructor: {
            name: this.is2014 ? data.name2014 : `Enhance ${CONFIG.DND5E.abilities[data.ability].label}`,
            type: this.is2014
              ? data.type ?? "utility"
              : "utility",
          },
          build: {
            generateConsumption: true,
            generateHealing: data.type === "heal",
            healingPart: DDBEnricherData.basicDamagePart({
              number: 2,
              denomination: 6,
              scalingMode: "none",
              type: "temphp",
              scalingNumber: "",
            }),
          },
        };
      });
  }

  get _effects2014() {
    return [
      {
        ability: "str",
        name: "Bull's Strength",
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("true", 20, "flags.dnd5e.powerfulBuild"),
        ],
      },
      {
        ability: "con",
        name: "Bear's Endurance",
        description: " Your encumbrance is doubled.",
      },
      {
        ability: "dex",
        name: "Cat's Grace",
        description: " You don't take damage from falling 20 feet or less if not incapacitated.",
      },
      {
        ability: "int",
        name: "Fox's Cunning",
      },
      {
        ability: "wis",
        name: "Owl's Wisdom",
      },
      {
        ability: "cha",
        name: "Eagle's Splendor",
      },
    ].map((data) => {
      return {
        name: data.name,
        activityMatch: data.name,
        options: {
          description: `Advantage on ${CONFIG.DND5E.abilities[data.ability].label} ability checks.${data.description ?? ""}`,
          durationSeconds: 3600,
        },
        changes: data.changes ?? [],
        midiChanges: [
          DDBEnricherData.ChangeHelper.customChange("1", 20, `flags.midi-qol.advantage.ability.check.${data.ability}`),
        ].concat(data.midiChanges ?? []),
      };
    });
  }

  get _effects2024() {
    return [
      { ability: "str" },
      // { ability: "con" },
      { ability: "dex" },
      { ability: "int" },
      { ability: "wis" },
      { ability: "cha" },
    ].map((data) => {
      return {
        name: `Enhanced ${CONFIG.DND5E.abilities[data.ability].label}`,
        activityMatch: `Enhance ${CONFIG.DND5E.abilities[data.ability].label}`,
        options: {
          description: `Advantage on ${CONFIG.DND5E.abilities[data.ability].label} ability checks.`,
          durationSeconds: 3600,
        },
        midiChanges: [
          DDBEnricherData.ChangeHelper.customChange("1", 20, `flags.midi-qol.advantage.ability.check.${data.ability}`),
        ],
      };
    });
  }

  get effects() {
    return this.is2014 ? this._effects2014 : this._effects2024;
  }

}
