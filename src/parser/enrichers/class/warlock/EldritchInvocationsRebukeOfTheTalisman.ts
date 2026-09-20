import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Rebuke of the Talisman (2014): when the talisman's wearer is hit, the warlock's reaction deals
 * psychic damage equal to their proficiency bonus to the attacker and pushes it 10 feet.
 */
export default class EldritchInvocationsRebukeOfTheTalisman extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
  }

  override get activity(): IDDBActivityData {
    return {
      activationType: "reaction",
      activationCondition: "When the wearer of your talisman is hit by an attacker you can see within 30 feet of you",
      targetType: "creature",
      targetCount: 1,
      rangeType: "ft",
      rangeValue: 30,
      data: {
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({
              customFormula: "@prof",
              types: ["psychic"],
            }),
          ],
        },
      },
    };
  }

}
