import DDBEnricherData from "../../data/DDBEnricherData";

export default class VestigeHealingTouch extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Divine Power: Healing Touch",
      targetType: "creature",
      activationType: "bonus",
      data: {
        healing: DDBEnricherData.basicDamagePart({
          number: 2,
          denomination: 8,
          bonus: "@abilities.cha.mod",
          types: ["healing"],
        }),
        range: { value: "5", units: "ft" },
      },
    };
  }

}
