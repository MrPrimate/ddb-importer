import DDBEnricherData from "../../data/DDBEnricherData";

/** Obojima paladin: a bonus action heals up to twice your Charisma modifier (minimum 2) creatures within 30 feet for 2d6 each. */
export default class BlessedPool extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  override get activity(): IDDBActivityData {
    return {
      activationType: "bonus",
      addItemConsume: true,
      data: {
        range: { override: true, value: "30", units: "ft" },
        target: {
          override: true,
          affects: { type: "creature", count: "max(2, 2 * @abilities.cha.mod)", choice: true },
        },
        healing: DDBEnricherData.basicDamagePart({ number: 2, denomination: 6, types: ["healing"] }),
      },
    };
  }

}
