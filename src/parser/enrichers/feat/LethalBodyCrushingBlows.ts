import DDBEnricherData from "../data/DDBEnricherData";

/** Lethal Body: an Unarmed Strike hit can deal 1d8 extra damage of the strike's type. */
export default class LethalBodyCrushingBlows extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "creature",
      targetCount: 1,
      activationType: "special",
      activationCondition: "You hit a target with an Unarmed Strike",
      noTemplate: true,
      data: {
        roll: { prompt: false, visible: false },
        damage: { parts: [DDBEnricherData.basicDamagePart({ number: 1, denomination: 8, types: ["bludgeoning"] })] },
      },
    };
  }

}
