import DDBEnricherData from "../../data/DDBEnricherData";

/** Leyline Magic Biorhythm: while attuned to a leyline, Arcane Recovery also heals 1d8 per spell slot recovered (scaling step = a slot). */
export default class ArcaneRecoveryBiorhythm extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "self",
      activationType: "special",
      activationCondition: "You use Arcane Recovery while attuned to a leyline",
      data: {
        consumption: { targets: [], scaling: { allowed: true, max: "" } },
        healing: DDBEnricherData.basicDamagePart({ number: 1, denomination: 8, types: ["healing"], scalingMode: "whole", scalingNumber: 1 }),
      },
    };
  }

}
