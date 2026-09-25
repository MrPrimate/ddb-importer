import DDBEnricherData from "../data/DDBEnricherData";

/** A charge releases a 10-foot cube of vortex from the holder that is difficult terrain for 1 hour. */
export default class HatOfVortexes extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Release Vortex",
      targetType: "creature",
      activationType: "action",
      activationCondition: "The vortex is difficult terrain",
      addItemConsume: true,
      noeffect: true,
      removeDamageParts: true,
      data: {
        target: {
          override: true,
          affects: { type: "creature" },
          template: { contiguous: false, units: "ft", type: "cube", size: "10" },
        },
        range: { override: true, value: null, units: "self", special: "" },
        duration: { override: true, value: "1", units: "hour" },
      },
    };
  }

}
