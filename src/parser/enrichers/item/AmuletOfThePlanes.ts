import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Amulet of the Planes: the DC 15 Intelligence (Arcana) check to plane shift.
 */
export default class AmuletOfThePlanes extends DDBEnricherData {
  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.CHECK;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Activate",
      targetType: "self",
      rangeSelf: true,
      noTemplate: true,
      data: { check: { ability: "int", associated: ["arc"], dc: { calculation: "", formula: "15" } } },
    };
  }

}
