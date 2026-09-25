import DDBEnricherData from "../../data/DDBEnricherData";

export default class LayDownTheLaw extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "ally",
      targetCount: 1,
      activationType: "bonus",
      addItemConsume: true,
      itemConsumeTargetName: "Risk",
      rangeType: "ft",
      rangeValue: 60,
      data: {
        healing: DDBEnricherData.basicDamagePart({
          customFormula: "1@scale.gunslinger.risk.die",
          types: ["temphp"],
        }),
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        // Gold Star Hero (level 14) upgrade: the warded ally also gains
        // resistance to bludgeoning, piercing and slashing damage
        name: "Iron-Clad Law",
        options: {
          expiry: "sourceStart",
        },
        changes: [
          DDBEnricherData.ChangeHelper.damageResistanceChange("bludgeoning"),
          DDBEnricherData.ChangeHelper.damageResistanceChange("piercing"),
          DDBEnricherData.ChangeHelper.damageResistanceChange("slashing"),
        ],
      },
    ];
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        action: {
          name: "Maneuver: Lay Down the Law (Attack)",
          type: "class",
          rename: ["Warding Attack"],
        },
        overrides: {
          activationType: "reaction",
          activationCondition: "The warded ally is hit by an attack before the start of your next turn",
        },
      },
    ];
  }

  override get override(): IDDBOverrideData {
    return {
      data: { name: "Lay Down the Law" },
    };
  }

}
