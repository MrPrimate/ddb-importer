import DDBEnricherData from "../data/DDBEnricherData";

/**
 * The name makes the generic parser treat this as a wall spell; it is really a
 * number of targets within range that gain an AC bonus.
 */
export default class SongOfTheShieldWall extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity(): IDDBActivityData {
    return {
      targetType: "creature",
      noTemplate: true,
      overrideTemplate: true,
      overrideTarget: true,
    };
  }

  get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Shield Wall",
        options: {
          durationSeconds: 60,
        },
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("2", 20, "system.attributes.ac.bonus"),
        ],
      },
    ];
  }

}
