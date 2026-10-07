import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Tasha's 2014 Deft Explorer bundles Canny, Roving (level 6) and Tireless (level 10). The 2024 feature
 * is only Expertise and languages: Roving and Tireless are separate features there, Roving's speed
 * comes from DDB's modifiers and Tireless has its own enricher, so nothing is added for 2024.
 */
export default class DeftExplorer extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return this.is2014 ? DDBEnricherData.ACTIVITY_TYPES.HEAL : DDBEnricherData.ACTIVITY_TYPES.NONE;
  }

  override get activity(): IDDBActivityData {
    if (!this.is2014) return {};
    return {
      name: "Tireless",
      targetType: "self",
      activationType: "action",
      addActivityConsume: true,
      data: {
        healing: DDBEnricherData.basicDamagePart({
          customFormula: "1d8 + @abilities.wis.mod", // "@classes.artificer.levels * 2",
          types: ["temphp"],
        }),
        uses: {
          max: "@prof",
          spent: 0,
          recovery: [{ period: "lr", type: "recoverAll", formula: undefined }],
        },
        visibility: {
          identifier: "ranger",
          level: {
            min: 10,
            max: null,
          },
        },
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    if (!this.is2014) return [];
    return [
      {
        name: "Roving",
        changes: [
          DDBEnricherData.ChangeHelper.addChange("5", 10, "system.attributes.movement.speeds.walk"),
          DDBEnricherData.ChangeHelper.upgradeChange("@attributes.movement.speeds.walk", 20, "system.attributes.movement.speeds.climb"),
          DDBEnricherData.ChangeHelper.upgradeChange("@attributes.movement.speeds.walk", 20, "system.attributes.movement.speeds.swim"),
        ],
        options: {
          transfer: true,
          disabled: this.ddbParser.isMuncher || (this.ddbParser._class?.level ?? 0) < 6,
        },
        data: {
          flags: {
            ddbimporter: {
              effectIdLevel: {
                min: 5,
                max: null,
              },
            },
          },
        },
      },
    ];
  }

}
