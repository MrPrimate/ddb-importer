import DDBEnricherData from "../../data/DDBEnricherData";

/** Winter Trapper: once per turn, a hit deals the Pin Down die extra (1d6, 1d8 from level 11) and cuts the target's Speed by 10 feet. */
export default class PinDownDamage extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "creature",
      targetCount: 1,
      activationType: "special",
      activationCondition: "Once per turn, you hit a creature with a weapon or an Unarmed Strike",
      data: {
        damage: { parts: [DDBEnricherData.basicDamagePart({ customFormula: "@scale.winter-trapper.pin-down" })] },
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Pinned Down",
        options: {
          durationSeconds: 6,
          description: "Speed reduced by 10 feet until the start of the ranger's next turn; from Ranger level 11 the creature also can't make Opportunity Attacks.",
        },
        changes: [DDBEnricherData.ChangeHelper.movementBonusChange("-10")],
      },
    ];
  }

}
