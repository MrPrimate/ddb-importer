import DDBEnricherData from "../../data/DDBEnricherData";

/** Circle of Wicker Bewitched Effigy, Sacrifice aura: a Reaction deals 1d8 plus Wisdom modifier Fire damage to a creature in the aura that takes damage. */
export default class SacrificeReaction extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "creature",
      targetCount: 1,
      noTemplate: true,
      activationType: "reaction",
      activationCondition: "A creature in the Sacrifice aura takes damage",
      noConsumeTargets: true,
      data: {
        damage: {
          parts: [DDBEnricherData.basicDamagePart({ number: 1, denomination: 8, bonus: "@abilities.wis.mod", types: ["fire"] })],
        },
      },
    };
  }

}
