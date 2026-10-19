import Generic from "../Generic";

export default class MagicAwareness extends Generic {

  // the DDB action builds the activity, so the feature's own parse adds none
  override get type(): IDDBActivityType | null {
    return this.isAction ? null : Generic.ACTIVITY_TYPES.NONE;
  }

  // senses any spell or magic item within 60 feet of you
  override get activity(): IDDBActivityData {
    return {
      data: {
        range: { override: true, units: "self", value: null },
        target: {
          override: true,
          template: { count: "1", contiguous: false, type: "radius", size: "60", units: "ft" },
          affects: { type: "space" },
        },
      },
    };
  }

}
