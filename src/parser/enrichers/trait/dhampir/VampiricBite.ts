import DDBEnricherData from "../../data/DDBEnricherData";

export default class VampiricBite extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.ATTACK;
  }

  get activity(): IDDBActivityData | null {
    return {
      noConsumeTargets: true,
      data: {
        damage: {
          includeBase: false,
          parts: [
            DDBEnricherData.basicDamagePart({
              number: 1,
              denomination: 4,
              bonus: "@abilities.con.mod",
              types: ["piercing"],
            }),
          ],
        },
      },
    };
  }

  get additionalActivities(): IDDBAdditionalActivity[] {
    if (this.is2014) {
      return [{
        init: {
          name: "Empower Self: Vampiric Bite",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        overrides: {
          addItemConsume: true,
          activationType: "special",
          targetType: "self",
        },
      }];
    }
    return [
      {
        init: {
          name: "Empower Self: Drain",
          type: DDBEnricherData.ACTIVITY_TYPES.HEAL,
        },
        overrides: {
          addItemConsume: true,
          activationType: "special",
          targetType: "self",
          data: {
            healing: DDBEnricherData.basicDamagePart({
              customFormula: "@scaling",
              type: "healing",
            }),
            consumption: {
              scaling: {
                allowed: true,
                max: "20",
              },
              spellSlot: true,
            },
          },
        },
      },
      {
        init: {
          name: "Empower Self: Strengthen",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        overrides: {
          addItemConsume: true,
          activationType: "special",
          targetType: "self",
        },
      },
    ];
  }

  get effects(): IDDBEffectHint[] {
    if (this.is2014) {
      return [
        {
          name: "Empower Self: Bonus",
          activitiesMatch: ["Empower Self: Vampiric Bite"],
        },
      ];
    }
    return [
      {
        name: "Empower Self: Strengthened",
        activitiesMatch: ["Empower Self: Strengthen"],
      },
    ];
  }

  get override(): IDDBOverrideData {
    return {
      data: {
        system: {
          type: {
            value: "simpleM",
          },
          proficient: 1,
        },
      },
    };
  }

}
