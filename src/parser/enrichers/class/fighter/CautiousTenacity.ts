import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Neko Duelist (OTFY). DDB models the two extra Second Wind uses as this feature's own pool with a
 * "Second Wind: Cautious Tenacity" action that only rolls; it becomes the Second Wind heal, and both
 * this and Second Wind grant the Dodge action until the end of the fighter's next turn.
 */
export default class CautiousTenacity extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Second Wind: Cautious Tenacity",
      activationType: "bonus",
      addItemConsume: true,
      targetType: "self",
      data: {
        healing: DDBEnricherData.basicDamagePart({
          number: 1,
          denomination: 10,
          bonus: "@classes.fighter.levels",
          types: ["healing"],
        }),
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Cautious Tenacity: Dodging",
        options: {
          expiry: "sourceEnd",
        },
        statuses: ["dodging"],
      },
    ];
  }

  override get override(): IDDBOverrideData {
    return {
      uses: this._getUsesWithSpent({
        type: "class",
        name: "Second Wind: Cautious Tenacity",
        max: "2",
        period: "lr",
      }),
    };
  }

}
