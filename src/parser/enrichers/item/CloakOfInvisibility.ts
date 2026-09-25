import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Cloak of Invisibility: Invisible while the hood is up, drawn from the 3 charges.
 */
export default class CloakOfInvisibility extends DDBEnricherData {
  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Raise Hood",
      targetType: "self",
      rangeSelf: true,
      addItemConsume: true,
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Hood Up: Invisible",
        statuses: ["Invisible"],
        options: {
          transfer: false,
          durationSeconds: 3600,
        },
      },
    ];
  }

}
