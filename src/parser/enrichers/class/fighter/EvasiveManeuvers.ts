import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Neko Duelist (OTFY). Nimble Redirect is a once-per-rest reaction: the damage reduction is applied
 * by hand, and the activity deals the reduced amount (the Fighter level) to a creature within 5 feet.
 * Deft Cover's Half Cover depends on positioning, so it stays description only.
 */
export default class EvasiveManeuvers extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Nimble Redirect",
      activationType: "reaction",
      activationCondition: "You're hit by an attack made with a weapon or an Unarmed Strike",
      addItemConsume: true,
      targetType: "creature",
      data: {
        range: { units: "ft", value: "5" },
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({
              customFormula: `@classes.${this.classIdentifier("Fighter")}.levels`,
              types: ["bludgeoning", "piercing", "slashing"],
            }),
          ],
        },
      },
    };
  }

  override get override(): IDDBOverrideData {
    return {
      uses: this._getUsesWithSpent({
        type: "class",
        name: "Nimble Redirect",
        max: "1",
        period: "sr",
      }),
    };
  }

}
