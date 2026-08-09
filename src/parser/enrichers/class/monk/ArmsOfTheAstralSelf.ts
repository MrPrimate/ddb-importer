import DDBEnricherData from "../../data/DDBEnricherData";

export default class ArmsOfTheAstralSelf extends DDBEnricherData {

  override get type() {
    return this.isAction ? DDBEnricherData.ACTIVITY_TYPES.ATTACK : DDBEnricherData.ACTIVITY_TYPES.NONE;
  }

  override get activity(): IDDBActivityData {
    return {
      noConsumeTargets: true,
      noeffect: true,
      data: {
        attack: {
          ability: "",
        },
        damage: {
          parts: [DDBEnricherData.basicDamagePart({
            customFormula: "@scale.monk.die.die + @mod",
            types: ["force"],
          })],
        },
      },
    };
  }

  override get additionalActivities() : IDDBAdditionalActivity[] {
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

  override get effects(): IDDBEffectHint[] {
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

  override get override(): IDDBOverrideData {
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
        flags: {
          ddbimporter: {
            skipScale: true,
          },
        },
      },
    };
  }

}
