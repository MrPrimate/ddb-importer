import Generic from "../Generic";

export default class NaturesWrath extends Generic {

  // the DDB action builds the activity, so the feature's own parse adds none
  override get type(): IDDBActivityType | null {
    return this.is2014 || this.isAction ? null : Generic.ACTIVITY_TYPES.NONE;
  }

  // 2024: each creature of your choice within 15 feet of yourself; 2014 ensnares one foe
  override get activity(): IDDBActivityData | null {
    if (this.is2014) return null;
    return {
      data: {
        range: { override: true, units: "self", value: null },
        target: {
          override: true,
          template: { count: "1", contiguous: false, type: "radius", size: "15", units: "ft" },
          affects: { type: "enemy", choice: true },
        },
      },
    };
  }

}
