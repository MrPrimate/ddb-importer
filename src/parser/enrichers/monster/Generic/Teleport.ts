import _MonsterFeatureSupport from "./_MonsterFeatureSupport";

interface IMonsterTeleport {
  distance: string;
  rider: boolean;
}

/**
 * Self-teleport monster features (Teleport, Psychic Step, Deathly Teleport, ...) routed through
 * GENERIC_FEATURE_NAME.
 *
 * Only the first sentence mentioning a teleport is read, so later sentences such as "each creature
 * within 10 feet of the space it left" never supply the distance. The creature must be moving
 * itself: passive or other-target wording ("is teleported", "teleport the target") and travel the
 * native teleport planner cannot place (planes, miles, resting places, remembered locations) keep
 * the parser's default activity.
 *
 * When the source also rolls a save or damage, the parser's activities stay primary and a costless
 * teleport is appended. Otherwise the primary activity becomes the teleport; activation is
 * deliberately left to the parser so action, bonus, reaction, legendary cost and recharge/uses
 * consumption survive. Healing is not a rider: the parser already adds heals as additional
 * activities, so Recuperative Teleport lands as teleport + heal.
 *
 * dnd5e 5.x has no teleport activity type, so "the teleport" here is a self-targeted utility
 * activity whose range is the travel distance; the move itself is made by hand.
 *
 * No ATL, AC5e or midi effects: a teleport has no ongoing state to automate.
 */
export default class Teleport extends _MonsterFeatureSupport {
  static UNSUPPORTED = /\bplanes?\b|demiplane|\bmiles?\b|resting place|familiar with|has (?:seen|visited)|\bmount\b|\bsteed\b|\btrees?\b/i;

  static NOT_SELF = /\b(?:is|be|are) teleported\b|\bteleports? (?:the|a|one) (?:target|creature)\b/i;

  _teleport: IMonsterTeleport | null | undefined;

  /** Parse the travel distance and whether the teleport rides on another roll. */
  get teleport(): IMonsterTeleport | null {
    if (this._teleport !== undefined) return this._teleport;
    this._teleport = null;

    const sentence = this.text.split(/(?<=\.)\s+/).find((s) => (/\bteleport/i).test(s));
    if (!sentence || Teleport.NOT_SELF.test(sentence) || Teleport.UNSUPPORTED.test(sentence)) return null;

    // "up to" wins over "within": "teleports itself or a willing demon within 10 feet of itself up to 60 feet"
    const afterTeleport = sentence.slice(sentence.search(/\bteleport/i));
    const match = afterTeleport.match(/up to (\d+) (?:feet|foot|ft)/i)
      ?? afterTeleport.match(/within (\d+) (?:feet|foot|ft)/i)
      ?? afterTeleport.match(/^teleports? (\d+) (?:feet|foot|ft)/i);
    if (!match) return null;

    const rider = this.save() !== null || this.damageTokens(this.text).length > 0;

    this._teleport = { distance: match[1], rider };
    return this._teleport;
  }

  override get type(): IDDBActivityType | null {
    const teleport = this.teleport;
    // dnd5e 5.x has no teleport activity: a self-targeted utility carries the range
    return teleport && !teleport.rider ? "utility" : null;
  }

  override get activity(): IDDBActivityData | null {
    const teleport = this.teleport;
    if (!teleport || teleport.rider) return null;
    return {
      data: {
        range: { override: true, value: teleport.distance, units: "ft", special: "" },
        target: {
          override: true,
          prompt: false,
          affects: { count: "1", type: "self" },
          template: {},
        },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    const teleport = this.teleport;
    if (!teleport?.rider) return [];
    return [
      this.extra("Teleport", "ddbTeleport00001", "utility", {
        rangeOverride: { override: true, value: teleport.distance, units: "ft", special: "" },
        targetOverride: { prompt: false, affects: { count: "1", type: "self" }, template: {} },
      }),
    ];
  }
}
