import DDBEnricherData from "../data/DDBEnricherData";

/**
 * The Magus Class cantrip. The caster expends and rolls Hit Dice and the touched creature regains
 * that many Hit Points: one die, two from character level 5, three from 11 and four from 17.
 */
export default class GiveLife extends DDBEnricherData {

  static CANTRIP_DICE = "1 + floor((@details.level + 1) / 6)";

  static hitDiceHealing(size: "smallest" | "largest"): Partial<IDDBActivityData> {
    return {
      targetType: "creature",
      targetCount: 1,
      additionalConsumptionTargets: [
        { type: "hitDice", target: size, value: GiveLife.CANTRIP_DICE, scaling: { mode: "", formula: "" } },
      ],
      data: {
        healing: DDBEnricherData.basicDamagePart({
          customFormula: "@consumed.hd",
          types: ["healing"],
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
      ...GiveLife.hitDiceHealing("smallest"),
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
          generateRange: true,
          generateHealing: true,
        },
        overrides: GiveLife.hitDiceHealing("largest"),
      },
    ];
  }

}
