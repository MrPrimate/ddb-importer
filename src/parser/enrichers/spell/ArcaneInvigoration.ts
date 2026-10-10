import DDBEnricherData from "../data/DDBEnricherData";

/**
 * The Magus Class. Roll and expend up to two Hit Dice (one more per slot level above 2) for
 * Temporary Hit Points equal to the roll plus the spellcasting modifier. The activities spend the
 * most dice the slot allows; one activity per die size.
 */
export default class ArcaneInvigoration extends DDBEnricherData {

  static hitDiceTempHp(size: "smallest" | "largest"): Partial<IDDBActivityData> {
    return {
      targetType: "self",
      rangeSelf: true,
      additionalConsumptionTargets: [
        { type: "hitDice", target: size, value: "2", scaling: { mode: "amount", formula: "1" } },
      ],
      data: {
        healing: DDBEnricherData.basicDamagePart({
          customFormula: "@consumed.hd + @mod",
          types: ["temphp"],
          scalingMode: "none",
        }),
      },
    };
  }

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Smallest Hit Dice",
      ...ArcaneInvigoration.hitDiceTempHp("smallest"),
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Largest Hit Dice",
          type: DDBEnricherData.ACTIVITY_TYPES.HEAL,
        },
        build: {
          generateConsumption: true,
          generateTarget: true,
          generateActivation: true,
          generateHealing: true,
        },
        overrides: ArcaneInvigoration.hitDiceTempHp("largest"),
      },
    ];
  }

}
