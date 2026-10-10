import DDBEnricherData from "../../data/DDBEnricherData";

/** Rocborne: once per turn, a weapon hit deals an extra 1d4 of the weapon's type, 1d8 from Ranger level 11. */
export default class GuidingWind extends DDBEnricherData {

  static strike(die: number, level: { min: number | null; max: number | null }): IDDBActivityData {
    return {
      name: `Wind-Guided Strike (1d${die})`,
      targetType: "creature",
      targetCount: 1,
      activationType: "special",
      activationCondition: "Once on each of your turns, you hit with a weapon attack",
      data: {
        damage: { parts: [DDBEnricherData.basicDamagePart({ number: 1, denomination: die })] },
        visibility: { identifier: "ranger", level },
      },
    };
  }

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
  }

  override get activity(): IDDBActivityData {
    return GuidingWind.strike(4, { min: null, max: 10 });
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: { name: "Wind-Guided Strike (1d8)", type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE },
        build: {
          generateConsumption: false,
          generateTarget: true,
          generateActivation: true,
          generateDamage: true,
          damageParts: [DDBEnricherData.basicDamagePart({ number: 1, denomination: 8 })],
        },
        overrides: GuidingWind.strike(8, { min: 11, max: null }),
      },
    ];
  }

}
