/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class ArmsOfTheAstralSelf extends DDBEnricherData {

  get type() {
    return "none";
  }

  get additionalActivities() {
    return [
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
    ];
  }

  get effects() {
    return [
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
        "flags.ddbimporter.skipScale": true,
      },
    };
  }

}
