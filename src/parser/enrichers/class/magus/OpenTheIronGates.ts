import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Knights Stygian level 14. A Bonus Action opens a 30 foot Emanation for a minute, once per Long
 * Rest. A creature starting its turn inside can take 1d6 Necrotic (3d6 if Bloodied), and a Bonus
 * Action frightens a Bloodied creature inside on a failed Wisdom save. Built here rather than
 * from DDB's actions so the feature keeps them when the builder toggle is off.
 */
export default class OpenTheIronGates extends DDBEnricherData {

  static turnStartDamage(number: number): IDDBActivityData {
    return {
      activationType: "special",
      activationCondition: number > 1
        ? "A Bloodied creature starts its turn in your Emanation"
        : "A creature starts its turn in your Emanation",
      targetType: "creature",
      targetCount: 1,
      noConsumeTargets: true,
      noTemplate: true,
      data: {
        range: { units: "spec", special: "Within your Emanation" },
        damage: {
          parts: [DDBEnricherData.basicDamagePart({ number, denomination: 6, types: ["necrotic"], scalingMode: "none" })],
        },
      },
    };
  }

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Open the Iron Gates",
      activationType: "bonus",
      addItemConsume: true,
      targetType: "self",
      data: {
        range: { units: "self" },
        duration: { value: "1", units: "minute" },
        target: {
          template: { type: "radius", size: "30", units: "ft", contiguous: false, count: "", width: "", height: "" },
          affects: { type: "creature", choice: true, count: "", special: "" },
        },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: { name: "Necrotic Damage", type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE },
        build: { generateActivation: true, generateTarget: true, generateRange: true, generateDamage: true },
        overrides: OpenTheIronGates.turnStartDamage(1),
      },
      {
        init: { name: "Necrotic Damage (Bloodied)", type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE },
        build: { generateActivation: true, generateTarget: true, generateRange: true, generateDamage: true },
        overrides: OpenTheIronGates.turnStartDamage(3),
      },
      {
        init: { name: "Frighten", type: DDBEnricherData.ACTIVITY_TYPES.SAVE },
        build: {
          generateActivation: true,
          generateTarget: true,
          generateRange: true,
          generateSave: true,
          saveOverride: { ability: ["wis"], dc: { calculation: "spellcasting", formula: "" } },
        },
        overrides: {
          activationType: "bonus",
          activationCondition: "A Bloodied creature of your choice within your Emanation",
          targetType: "creature",
          targetCount: 1,
          noConsumeTargets: true,
          noTemplate: true,
          rangeValue: 30,
          rangeType: "ft",
        },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Frightened",
        activityMatch: "Frighten",
        statuses: ["frightened"],
        options: {
          expiry: "sourceStart",
        },
      },
    ];
  }

  override get override(): IDDBOverrideData {
    return {
      uses: this._getUsesWithSpent({
        type: "class",
        name: "Open the Iron Gates",
        max: "1",
        period: "lr",
      }),
    };
  }

}
