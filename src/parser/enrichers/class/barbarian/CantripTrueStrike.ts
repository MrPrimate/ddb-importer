import DDBEnricherData from "../../data/DDBEnricherData";

/** "Cantrips": True Strike adds 1d6 of the weapon's type, plus half your barbarian level while raging. */
export default class CantripTrueStrike extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "True Strike",
      targetType: "creature",
      targetCount: 1,
      activationType: "special",
      activationCondition: "Once on each of your turns, you hit with a Strength-based attack",
      noTemplate: true,
      data: {
        damage: {
          parts: [DDBEnricherData.basicDamagePart({ number: 1, denomination: 6, types: ["bludgeoning", "piercing", "slashing"] })],
        },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: { name: "True Strike (Raging)", type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE },
        build: {
          generateConsumption: false,
          generateTarget: true,
          generateActivation: true,
          generateDamage: true,
          activationOverride: { type: "special", value: 1, condition: "Once on each of your turns, you hit with a Strength-based attack while raging" },
          damageParts: [DDBEnricherData.basicDamagePart({ number: 1, denomination: 6, bonus: "floor(@classes.barbarian.levels / 2)", types: ["bludgeoning", "piercing", "slashing"] })],
        },
        overrides: { targetType: "creature", noConsumeTargets: true, noTemplate: true },
      },
    ];
  }

}
