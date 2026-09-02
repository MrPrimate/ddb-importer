import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * The importer-built Faithful Hound's watch. Using Bark from the hound token
 * places a 30-foot emanation attached to it; the region whispers the hound's
 * owner (and the GM) when a Small or larger creature enters. The password
 * exemption is manual. The bite happens at the start of the caster's turns and
 * stays a manual activity.
 */
export default class Bark extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Bark",
      targetType: "creature",
      activationType: "special",
      activationCondition: "A Small or larger creature comes within 30 feet without speaking the password",
      data: {
        target: {
          override: true,
          affects: {
            type: "creature",
          },
          template: {
            count: "1",
            contiguous: false,
            type: "radius",
            size: "30",
            units: "ft",
          },
        },
        behaviors: [
          DDBEnricherData.BehaviorHelper.macro({
            name: "Bark",
            handler: "notify",
            events: ["tokenEnter"],
            sizes: ["sm", "med", "lg", "huge", "grg"],
            args: {
              excludeSelf: true,
              message: "The Faithful Hound barks loudly: {token} came within 30 feet of it!",
            },
          }),
        ],
      },
    };
  }

}
