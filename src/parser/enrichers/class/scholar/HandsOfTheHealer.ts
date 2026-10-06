import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Free League Scholar: at the end of a short rest, up to twice your proficiency bonus friendly
 * creatures that spent Hit Dice regain an extra 1d6 per Hit Die (1d8 from 9th level). Each scaling
 * step adds a Hit Die's worth.
 */
export default class HandsOfTheHealer extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Hands of a Healer",
      activationType: "special",
      activationCondition: "End of a short rest, for creatures that spent Hit Dice",
      data: {
        target: {
          override: true,
          affects: { type: "ally", count: "2 * @prof", choice: true },
        },
        consumption: {
          targets: [],
          scaling: { allowed: true, max: "@classes.scholar.levels" },
        },
        healing: DDBEnricherData.basicDamagePart({
          customFormula: "(@scaling)d(6 + 2 * min(1, floor(@classes.scholar.levels / 9)))",
          types: ["healing"],
        }),
      },
    };
  }

}
