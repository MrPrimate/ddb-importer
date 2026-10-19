import DDBEnricherData from "../data/DDBEnricherData";

// the Cold and Necrotic resistances come from DDB's modifiers
export default class BoonOfTheSoulDrinker extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Siphon Life",
      activationType: "reaction",
      activationCondition: "An enemy within 120 feet of you is reduced to 0 Hit Points",
      targetType: "self",
      addItemConsume: true,
      data: {
        healing: DDBEnricherData.basicDamagePart({ customFormula: "50", types: ["healing"] }),
      },
    };
  }

  override get override(): IDDBOverrideData {
    return {
      uses: this._getUsesWithSpent({ type: "feat", name: "Siphon Life", max: "1", period: "sr" }),
    };
  }

}
