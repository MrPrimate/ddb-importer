import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Nature's Sanctuary (Circle of the Land, 2024). The DDB action supplies the 15-foot cube;
 * this adds the bonus-action move and the four Nature's Ward effects (half cover plus the
 * land's damage resistance) that the sanctuary grants to allies inside it. All four are linked
 * so the sheet can apply the one matching the chosen land.
 */
export default class NaturesSanctuary extends DDBEnricherData {

  override get useDefaultAdditionalActivities(): boolean {
    return true;
  }

  override get addToDefaultAdditionalActivities(): boolean {
    return true;
  }

  override get activity(): IDDBActivityData | null {
    if (!this.isAction) return null;
    return {
      addItemConsume: true,
      itemConsumeTargetName: "Wild Shape",
      data: {
        duration: {
          value: "1",
          units: "minute",
        },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    if (this.isAction) return [];
    return [
      {
        init: {
          name: "Move Sanctuary",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          generateActivation: true,
          generateTarget: false,
          generateRange: true,
          generateConsumption: false,
          generateUtility: true,
          activationOverride: {
            type: "bonus",
            value: null,
            condition: "Move the sanctuary up to 60 feet",
          },
        },
        overrides: {
          rangeType: "ft",
          rangeValue: 120,
          noTemplate: true,
          noConsumeTargets: true,
        },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    if (this.isAction) return [];
    return [
      { origin: "Arid", type: "fire" },
      { origin: "Polar", type: "cold" },
      { origin: "Temperate", type: "lightning" },
      { origin: "Tropical", type: "poison" },
    ].map((land) => ({
      name: `Nature's Ward: ${land.origin}`,
      activityMatch: "Nature's Sanctuary",
      statuses: ["coverHalf"],
      changes: [
        DDBEnricherData.ChangeHelper.damageResistanceChange(land.type),
      ],
      options: {
        durationSeconds: 60,
      },
    }));
  }

}
