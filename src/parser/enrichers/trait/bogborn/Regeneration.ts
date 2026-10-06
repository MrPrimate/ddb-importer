import DDBEnricherData from "../../data/DDBEnricherData";

/** Bogborn: a Bonus Action spends a Hit Point Die to heal its roll plus your Constitution modifier (minimum 1); not after Acid or Fire damage. */
export default class Regeneration extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "self",
      activationType: "bonus",
      data: {
        consumption: {
          targets: [{ type: "hitDice", target: "largest", value: "1", scaling: { mode: "", formula: "" } }],
          scaling: { allowed: false, max: "" },
        },
        healing: DDBEnricherData.basicDamagePart({
          customFormula: "max(1, @consumed.hd + @abilities.con.mod)",
          types: ["healing"],
        }),
      },
    };
  }

}
