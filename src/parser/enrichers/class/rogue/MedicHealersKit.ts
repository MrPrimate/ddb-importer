import DDBEnricherData from "../../data/DDBEnricherData";

/** Grim Surgeon Medic: a Bonus Action and a healer's kit use heal a creature 1d4 + proficiency bonus, once per short or long rest per creature. */
export default class MedicHealersKit extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "creature",
      targetCount: 1,
      activationType: "bonus",
      activationCondition: "Expend one use of a healer's kit",
      data: {
        range: { override: true, units: "touch" },
        healing: DDBEnricherData.basicDamagePart({ number: 1, denomination: 4, bonus: "@prof", types: ["healing"] }),
      },
    };
  }

}
