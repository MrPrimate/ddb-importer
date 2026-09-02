import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Frost Sorcery: a bonus action freezes up to five contiguous 5-foot squares of
 * ice difficult terrain until the end of the caster's next turn. Sorcery points
 * spent for extra squares are the parsed "Freeze" activity.
 */
export default class CreateIce extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  /** Keeps the parsed "Create Ice: Freeze" (sorcery points for more squares) beside the placer. */
  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        action: {
          name: "Create Ice: Freeze",
          type: "class",
        },
      },
    ];
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Create Ice",
      activationType: "bonus",
      targetType: "creature",
      data: {
        target: {
          override: true,
          affects: {
            type: "creature",
          },
          template: {
            count: "5",
            contiguous: true,
            type: "square",
            size: "5",
            units: "ft",
          },
        },
        duration: {
          override: true,
          value: "1",
          units: "round",
        },
        behaviors: [
          DDBEnricherData.BehaviorHelper.difficultTerrain({ types: ["ice"] }),
        ],
      },
    };
  }

}
