import DDBEnricherData from "../../data/DDBEnricherData";

/** Cervan: when an attack deals more than half your remaining Hit Points, regain 1d12 + Constitution modifier, once per long rest. */
export default class SurgeOfVigor extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "self",
      activationType: "reaction",
      activationCondition: "An attack deals more than half your remaining Hit Points (even if it drops you to 0)",
      addItemConsume: true,
      data: {
        healing: DDBEnricherData.basicDamagePart({ number: 1, denomination: 12, bonus: "@abilities.con.mod", types: ["healing"] }),
      },
    };
  }

  override get override(): IDDBOverrideData {
    return {
      uses: this._getUsesWithSpent({ type: "race", name: "Surge of Vigor", max: "1", period: "lr" }),
    };
  }

}
