import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Proficiency bonus d4s, one more d4 in dim light or darkness. Doomed to the Shadows (15th
 * level) turns these into proficiency bonus d8s and an extra 2d8.
 */
export default class StrikeFromTheDark extends DDBEnricherData {

  get isDoomed(): boolean {
    return this.hasClassFeature({ featureName: "Doomed to the Shadows" });
  }

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
  }

  override get activity(): IDDBActivityData {
    const die = this.isDoomed ? 8 : 4;
    return {
      name: "Strike from the Dark",
      activationType: "special",
      activationCondition: "Once per turn, when you hit an interdicted creature with a melee weapon attack with advantage",
      targetType: "creature",
      targetCount: 1,
      damageParts: [
        DDBEnricherData.basicDamagePart({
          customFormula: `(@prof)d${die}`,
        }),
      ],
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Strike from the Dark (Dim Light or Darkness)",
          type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE,
        },
        build: {
          generateActivation: true,
          generateTarget: true,
          generateDamage: true,
          activationOverride: {
            type: "special",
            value: null,
            condition: "The target is in dim light or darkness",
          },
          damageParts: [
            DDBEnricherData.basicDamagePart({
              customFormula: this.isDoomed ? "(@prof)d8 + 2d8" : "(@prof + 1)d4",
            }),
          ],
        },
        overrides: {
          targetType: "creature",
          targetCount: 1,
        },
      },
    ];
  }

}
