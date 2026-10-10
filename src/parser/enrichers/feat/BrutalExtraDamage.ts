import DDBEnricherData from "../data/DDBEnricherData";

/** Hulking Figure: once per turn, an Unarmed Strike hit deals an extra 1d4 Bludgeoning. DDB's use has no recovery, so it is given one each turn. */
export default class BrutalExtraDamage extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "creature",
      activationType: "special",
      activationCondition: "Once per turn, you hit a target with an Unarmed Strike",
      data: {
        damage: {
          parts: [DDBEnricherData.basicDamagePart({ number: 1, denomination: 4, types: ["bludgeoning"] })],
        },
      },
    };
  }

  override get override(): IDDBOverrideData {
    return {
      uses: { spent: null, max: "1", recovery: [{ period: "turn", type: "recoverAll" }] },
    };
  }

}
