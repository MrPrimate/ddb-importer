/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class ArmsOfTheAstralSelf extends DDBEnricherData {

  get type() {
    return this.isAction ? "attack" : "none";
  }

  get activity() {
    return {
      noConsumeTargets: true,
      noeffect: true,
      data: {
        "attack.ability": "",
        "damage.parts": [DDBEnricherData.basicDamagePart({
          customFormula: "@scale.monk.die.die + @mod",
          types: ["force"],
        })],
      },
    };
  }

  get additionalActivities() {
    return this.isAction
      ? []
      : [
        {
          action: {
            name: "Arms of the Astral Self: Summon",
            type: "class",
            rename: ["Summon"],
          },
        },
        {
          action: {
            name: "Arms of the Astral Self (DEX/STR)",
            type: "class",
            rename: ["DEX/STR Attack"],
          },
        },
        {
          action: {
            name: "Arms of the Astral Self (WIS)",
            type: "class",
            rename: ["WIS Attack"],
          },
        },
        {
          action: {
            name: "Arms of the Astral Self",
            type: "class",
            rename: ["DEX/STR Attack"],
          },
        },
        {
          action: {
            name: "Arms of the Astral Self (Wis)",
            type: "class",
            rename: ["WIS Attack"],
          },
        },
        {
          action: {
            name: "Arms of the Astral Self (Wis.)",
            type: "class",
            rename: ["WIS Attack"],
          },
        },
      ];
  }

  get effects() {
    return this.isAction
      ? []
      : [
        {
          activityMatch: "Summon",
          name: `${this.data.name} (Save Modifications)`,
          changes: [
            DDBEnricherData.ChangeHelper.unsignedAddChange("- @abilities.str.mod + @abilities.wis.mod", 0, "system.abilities.str.bonuses.check"),
            DDBEnricherData.ChangeHelper.unsignedAddChange("- @abilities.str.mod + @abilities.wis.mod", 0, "system.abilities.str.bonuses.save"),
          ],
          options: {
            durationSeconds: 600,
          },
        },
      ];
  }

  get override() {
    return {
      replaceActivityUses: true,
      data: {
        system: {
          properties: ["fin"],
          range: {
            units: "ft",
            value: 10,
          },
        },
        "flags.ddbimporter.skipScale": true,
      },
    };
  }

}
