import _MonsterFeatureSupport from "./_MonsterFeatureSupport";

/** Source-guarded activities for Iron Scent. */
export default class IronScent extends _MonsterFeatureSupport {
  override get activity(): IDDBActivityData | null {
    const radius = this.text.match(/within (\d+) feet/i)?.[1];
    if (radius)
      return {
        name: "Iron Scent",
        activationType: "special",
        noConsumeTargets: true,
        data: {
          target: { template: { type: "radius", size: radius, units: "ft" } },
        },
      };
    return null;
  }

  override get type(): IDDBActivityType | null {
    return this.activity ? "utility" : null;
  }
}
