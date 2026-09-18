import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Hold Breath is shared by several species with different limits ("up to 15 minutes at a time",
 * "up to 1 hour"), so the span is read from the trait text rather than fixed here.
 */
export default class HoldBreath extends DDBEnricherData {

  static DEFAULT_MINUTES = 15;

  /** The breath-holding limit in minutes, from the trait's own wording. */
  get minutes(): number {
    const definition = this.ddbParser?.ddbDefinition;
    const description = definition?.description ?? definition?.snippet ?? "";
    const match = (/hold your breath for (?:up to )?(\d+) (minute|hour)s?/i).exec(description);
    if (!match) return HoldBreath.DEFAULT_MINUTES;
    return parseInt(match[1]) * (match[2].toLowerCase() === "hour" ? 60 : 1);
  }

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    const minutes = this.minutes;
    return {
      targetType: "self",
      activationType: "special",
      data: {
        duration: minutes % 60 === 0
          ? { value: `${minutes / 60}`, units: "hour" }
          : { value: `${minutes}`, units: "minute" },
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        options: {
          durationSeconds: this.minutes * 60,
        },
      },
    ];
  }

}
