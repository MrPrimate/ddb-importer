import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Relentless Endurance (orc, half-orc and their lineages): dropping to 1 hit point instead of
 * 0 is modelled, as in the official compendium, as a 1 hit point heal on the reduced-to-zero
 * trigger. The DDB action shares the trait name, so this enricher runs for both
 */
export default class RelentlessEndurance extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  override get activity(): IDDBActivityData {
    return {
      activationType: "special",
      activationCondition: "When you are reduced to 0 hit points but not killed outright",
      targetType: "self",
      rangeSelf: true,
      addItemConsume: true,
      data: {
        healing: DDBEnricherData.basicDamagePart({
          customFormula: "1",
          types: ["healing"],
        }),
      },
    };
  }

}
