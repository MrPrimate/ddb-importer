import DDBEnricherData from "../data/DDBEnricherData";

interface IRequiemVariant {
  /** the addiction save is "DC <base> + 1 per question asked" */
  dcBase: number;
  weeklyDc: number;
  maxQuestions: number;
}

/**
 * Requiem Bliss and Requiem Clay: smoking the drug answers up to N questions at 1d6 poison
 * damage each, then "a Constitution saving throw (DC 12 + 1 per question asked)" against
 * addiction. The questions are the scaling step: the activity carries a pool of N uses, one
 * question consumes one, and amount scaling adds the rest - so the DC is `<base + 1> + @scaling`
 * and the poison rolls 1d6 per question. The weekly save to break the addiction is its own
 * activity at the printed DC.
 */
export default class Requiem extends DDBEnricherData {

  static VARIANTS: Record<string, IRequiemVariant> = {
    "Requiem Bliss": { dcBase: 12, weeklyDc: 15, maxQuestions: 10 },
    "Requiem Clay": { dcBase: 10, weeklyDc: 13, maxQuestions: 5 },
  };

  get variant(): IRequiemVariant {
    return Requiem.VARIANTS[this.name] ?? Requiem.VARIANTS["Requiem Clay"];
  }

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  override get activity(): IDDBActivityData {
    const variant = this.variant;
    return {
      name: "Smoke",
      targetType: "self",
      activationType: "action",
      activationCondition: "One use of the activity per question asked",
      addActivityConsume: true,
      addActivityScalingMode: "amount",
      addConsumptionScalingMax: `${variant.maxQuestions - 1}`,
      removeDamageParts: true,
      damageParts: [
        DDBEnricherData.basicDamagePart({ number: 1, denomination: 6, type: "poison", scalingMode: "whole", scalingNumber: 1 }),
      ],
      noTemplate: true,
      data: {
        damage: {
          onSave: "full",
        },
        save: {
          ability: ["con"],
          dc: {
            calculation: "",
            formula: `${variant.dcBase + 1} + @scaling`,
          },
        },
        uses: {
          spent: 0,
          max: `${variant.maxQuestions}`,
          recovery: [],
        },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Weekly Addiction Save",
          type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
        },
        build: {
          generateSave: true,
          generateActivation: true,
          generateConsumption: false,
          generateDamage: false,
          generateTarget: true,
          activationOverride: {
            type: "special",
            value: null,
            condition: "At the end of each week while addicted",
          },
          saveOverride: {
            ability: ["con"],
            dc: {
              calculation: "",
              formula: `${this.variant.weeklyDc}`,
            },
          },
        },
        overrides: {
          targetType: "self",
          noTemplate: true,
        },
      },
    ];
  }

}
