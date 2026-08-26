import TurnStartAuraSave from "./TurnStartAuraSave";

/**
 * Juiblex's Foul trait: The parser extracts
 * the save but no template ("within 10 feet" prose), so the emanation is supplied
 * here; the ooze exemption is the region's excluded creature type.
 */
export default class Foul extends TurnStartAuraSave {

  override get behaviorFilters(): { sizes?: string[]; types?: string[]; excludeTypes?: string[] } {
    return { excludeTypes: ["ooze"] };
  }

  override get activity(): IDDBActivityData {
    const base = super.activity;
    if (!this.isTargetTurnAura) return base;
    return {
      ...base,
      targetType: "creature",
      data: {
        ...base.data,
        target: {
          override: true,
          affects: {
            type: "creature",
          },
          template: {
            count: "1",
            contiguous: false,
            type: "radius",
            size: "10",
            units: "ft",
          },
        },
      },
    };
  }

}
