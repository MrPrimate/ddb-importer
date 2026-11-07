import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Worgen (World of Warcraft): a Bonus Action bestial form for 1 minute, Proficiency Bonus uses per
 * Long Rest, granting 2 x PB Temporary Hit Points, +10 ft Speed and Necrotic Resistance. Reactive
 * Movement (a Reaction to move 10 ft) comes from DDB's action.
 */
export default class Darkflight extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Shape-shift",
      activationType: "bonus",
      addItemConsume: true,
      targetType: "self",
      data: {
        duration: { units: "minute", value: "1" },
        healing: DDBEnricherData.basicDamagePart({ customFormula: "2 * @prof", types: ["temphp"] }),
      },
    };
  }

  override get override(): IDDBOverrideData {
    return {
      uses: {
        max: "@prof",
        recovery: [{ period: "lr", type: "recoverAll", formula: "" }],
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Darkflight",
        options: {
          durationSeconds: 60,
          description: "You can take a Reaction to move up to 10 feet when a creature ends its turn within 5 feet of you, without provoking Opportunity Attacks.",
        },
        changes: [
          DDBEnricherData.ChangeHelper.movementBonusChange("10", 20),
          DDBEnricherData.ChangeHelper.damageResistanceChange("necrotic"),
        ],
      },
    ];
  }

}
