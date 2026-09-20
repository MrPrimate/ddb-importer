import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Dust of Disappearance: everything within 10 feet becomes Invisible for 2d4 minutes.
 */
export default class DustOfDisappearance extends DDBEnricherData {
  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Scatter Dust",
      data: { target: { template: { type: "radius", size: "10", units: "ft", count: "" }, affects: { count: "", type: "creatureOrObject", choice: false, special: "" } } },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Invisible",
        statuses: ["Invisible"],
        options: {
          transfer: false,
          durationSeconds: 300,
          description: "Invisible for 2d4 minutes, or until the creature attacks or casts a spell.",
        },
      },
    ];
  }

}
