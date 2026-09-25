import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Warrior of the Street Special Move: after a missed Unarmed Strike, 1 Focus Point still deals
 * the Dexterity modifier as damage. The miss does not reset Combo, so leave the Combo effects in
 * place. Force is offered beside Bludgeoning for Empowered Strikes, gained at the same level.
 */
export default class SpecialMoveGuardBreaker extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Guard Breaker",
      targetType: "creature",
      activationType: "special",
      activationCondition: "You miss a creature with an Unarmed Strike attack roll",
      addItemConsume: true,
      itemConsumeTargetName: "Monk's Focus",
      itemConsumeValue: "1",
      data: {
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({ customFormula: "@abilities.dex.mod", types: ["bludgeoning", "force"] }),
          ],
        },
      },
    };
  }

}
