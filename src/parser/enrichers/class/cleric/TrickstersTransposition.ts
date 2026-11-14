import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Trickster's Transposition (2024 Trickery Domain): a bonus action teleport to the Invoke
 * Duplicity illusion, or a swap with it. DDB ships no action for it, so without this the
 * feature imports with no activity at all. The destination is wherever the illusion is, so the
 * teleport distance is unlimited, as in the PHB.
 */
export default class TrickstersTransposition extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.TELEPORT;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Transpose",
      activationType: "bonus",
      activationCondition: "While your Invoke Duplicity illusion is present",
      targetType: "self",
      rangeSelf: true,
      data: {
        teleport: {
          override: true,
          value: "",
          units: "ft",
        },
      },
    };
  }

}
