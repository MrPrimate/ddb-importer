import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Wickerbone Behemoth: a bonus action and a Wild Shape use turn you into a behemoth for 10 minutes
 * (Shillelagh arms, Barkskin without Concentration). Attackers take 1d4 piercing splinters (2d4 from
 * druid level 10), and you regenerate half the damage taken each turn up to 5 x proficiency bonus.
 */
export default class WickerboneBehemoth extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Become Behemoth",
      targetType: "self",
      activationType: "bonus",
      activationCondition: "Not wearing armor or holding a Shield",
      addItemConsume: true,
      itemConsumeTargetName: "wild-shape",
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: { name: "Splinter", type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE },
        build: {
          generateConsumption: false,
          generateTarget: true,
          generateActivation: true,
          generateDamage: true,
          activationOverride: { type: "special", value: 1, condition: "A creature damages you with an attack (each creature of your choice within 5 feet)" },
          damageParts: [DDBEnricherData.basicDamagePart({ customFormula: "(1 + min(1, floor(@classes.druid.levels / 10)))d4", types: ["piercing"] })],
        },
        overrides: { targetType: "creature", noConsumeTargets: true, noTemplate: true },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Wickerbone Behemoth",
        activityMatch: "Become Behemoth",
        options: {
          durationSeconds: 600,
          description: "Each arm is a Shillelagh club (with its mastery); Disadvantage on Sleight of Hand with them. Barkskin without Concentration. At the start of each turn regain half the damage taken since your last turn, up to five times your proficiency bonus (not while Unconscious).",
        },
      },
    ];
  }

}
