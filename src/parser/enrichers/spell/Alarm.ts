import DDBEnricherData from "../data/DDBEnricherData";

/**
 * "Cast" places the warded area (a 20-foot cube by default; a door or window is a
 * smaller region the GM reshapes) and the region whispers the caster whenever a
 * creature enters it, once per turn. Creatures designated at cast are exempt
 * in the rules; that is a manual exclusion (or a disposition filter on the
 * region behavior).
 */
export default class Alarm extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Cast",
      targetType: "creature",
      activationCondition: "Designated creatures do not set off the alarm",
      data: {
        target: {
          override: true,
          affects: {
            type: "creature",
          },
          template: {
            count: "1",
            contiguous: false,
            type: "cube",
            size: "20",
            units: "ft",
          },
        },
        behaviors: [
          DDBEnricherData.BehaviorHelper.macro({
            name: "Alarm",
            handler: "notify",
            events: ["tokenEnter"],
            args: {
              excludeSelf: true,
              message: "Alarm: {token} entered the warded area ({region}).",
            },
          }),
        ],
      },
    };
  }

}
