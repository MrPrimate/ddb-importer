import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Warrior of the Street level 11: 1 Focus Point on your turn, no action required, grants a Fly
 * Speed equal to your Speed until the end of your next turn and Advantage on your next melee
 * attack this turn. The advantage is one attack only, which needs DAE's usage token or removing
 * by hand.
 */
export default class AirDash extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get useDefaultAdditionalActivities(): boolean {
    return false;
  }

  override get addAutoAdditionalActivities(): boolean {
    return false;
  }

  override get clearAutoEffects(): boolean {
    return true;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Air Dash",
      targetType: "self",
      activationType: "special",
      activationCondition: "On your turn, no action required",
      addItemConsume: true,
      itemConsumeTargetName: "Monk's Focus",
      itemConsumeValue: "1",
      data: {
        range: { units: "self" },
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Air Dash: Flight",
        options: {
          expiry: "sourceEnd",
          description: "You have a Fly Speed equal to your Speed until the end of your next turn.",
        },
        changes: [
          DDBEnricherData.ChangeHelper.upgradeChange("@attributes.movement.speeds.walk", 20, "system.attributes.movement.speeds.fly"),
        ],
      },
      {
        name: "Air Dash: Advantage",
        daeSpecialDurations: ["1Attack" as const],
        options: {
          expiry: "turnEnd",
          description: "Advantage on the next melee attack you make before the end of the current turn.",
        },
        changes: [
          DDBEnricherData.ChangeHelper.ruleAdvantageChange("attack", {
            conditions: DDBEnricherData.ChangeHelper.MELEE_ATTACK_FILTER,
          }),
        ],
      },
    ];
  }

}
