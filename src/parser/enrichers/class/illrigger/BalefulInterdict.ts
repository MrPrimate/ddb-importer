import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Baleful Interdict is the Illrigger's seal pool (Baleful Interdict Seals
 * scale, short rest recovery). Placing a seal spends a use and applies a
 * stackable Interdict Seal effect to the target; burning seals deals 1d6 per
 * seal burned (the player removes stacks manually).
 */
export default class BalefulInterdict extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity(): IDDBActivityData {
    return {
      name: "Place Seal",
      targetType: "creature",
      targetCount: 1,
      activationType: "special",
      activationCondition: "Once on your turn: on a weapon hit (no action) or as a Bonus Action",
      addItemConsume: true,
      rangeType: "ft",
      rangeValue: 30,
      data: {
        duration: {
          units: "minute",
          value: "1",
        },
      },
    };
  }

  get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Move Seals",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          noeffect: false,
          generateActivation: true,
          generateTarget: true,
          generateUtility: true,
          activationOverride: {
            type: "bonus",
            value: 1,
            condition: "",
          },
        },
        overrides: {
          noConsumeTargets: true,
          targetType: "creature",
          rangeType: "ft",
          rangeValue: 30,
        },
      },
      {
        init: {
          name: "Burn Seal (Fire)",
          type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE,
        },
        build: {
          noeffect: true,
          generateActivation: true,
          generateTarget: true,
          generateDamage: true,
          activationOverride: {
            type: "special",
            value: null,
            condition: "Burn any number of seals on the target (1d6 per seal)",
          },
          damageParts: [
            DDBEnricherData.basicDamagePart({
              number: 1,
              denomination: 6,
              type: "fire",
            }),
          ],
          allowCritical: false,
        },
        overrides: {
          noConsumeTargets: true,
          targetType: "creature",
        },
      },
      {
        init: {
          name: "Burn Seal (Necrotic)",
          type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE,
        },
        build: {
          noeffect: true,
          generateActivation: true,
          generateTarget: true,
          generateDamage: true,
          activationOverride: {
            type: "special",
            value: null,
            condition: "Burn any number of seals on the target (1d6 per seal)",
          },
          damageParts: [
            DDBEnricherData.basicDamagePart({
              number: 1,
              denomination: 6,
              type: "necrotic",
            }),
          ],
          allowCritical: false,
        },
        overrides: {
          noConsumeTargets: true,
          targetType: "creature",
        },
      },
    ];
  }

  get effects(): IDDBEffectHint[] {
    return [
      {
        // stackable marker for seals on the target, applied by placing or
        // moving seals; stacks are removed manually when burned
        name: "Interdict Seal",
        activitiesMatch: ["Place Seal", "Move Seals"],
        daeStackable: "count",
        options: {
          durationSeconds: 60,
        },
      },
    ];
  }

  get override(): IDDBOverrideData {
    return {
      data: {
        system: {
          uses: {
            spent: 0,
            max: "@scale.illrigger.seals",
            recovery: [{ period: "sr", type: "recoverAll" }],
          },
        },
      },
    };
  }

}
