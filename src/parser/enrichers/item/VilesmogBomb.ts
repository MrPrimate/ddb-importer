import DDBEnricherData from "../data/DDBEnricherData";

/**
 * The vapor lingers for 2 rounds but what it does to a creature lasts a minute, even after the
 * creature leaves, so the exposure is its own activity that applies the effect, used by hand on a
 * creature in the vapor. Losing Resistance and Immunity to Poison has no active effect form; the
 * effect adds the Vulnerability and states the rest. DDB's own modifier would give the
 * Vulnerability to whoever carries the vial, so the automatic effect is dropped.
 */
export default class VilesmogBomb extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Throw",
      targetType: "creature",
      activationType: "action",
      noConsumeTargets: true,
      noeffect: true,
      removeDamageParts: true,
      data: {
        target: {
          override: true,
          affects: { type: "creature" },
          template: { contiguous: false, units: "ft", type: "sphere", size: "15" },
        },
        range: { override: true, value: "30", units: "ft" },
        duration: { override: true, value: "2", units: "round" },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: { name: "Vilesmog Exposure", type: DDBEnricherData.ACTIVITY_TYPES.UTILITY },
        build: {
          generateSave: false,
          generateDamage: false,
          generateActivation: true,
          generateConsumption: false,
          generateTarget: true,
          generateRange: true,
          activationOverride: {
            type: "special",
            value: null,
            condition: "Enters the vapor or starts its turn there",
          },
          targetOverride: { override: true, affects: { count: "1", type: "creature" }, template: {} },
          rangeOverride: { override: true, value: null, units: "self", special: "" },
        },
        overrides: { noConsumeTargets: true, noTemplate: true },
      },
    ];
  }

  override get clearAutoEffects(): boolean {
    return true;
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Vilesmog",
        activityMatch: "Vilesmog Exposure",
        changes: [DDBEnricherData.ChangeHelper.damageVulnerabilityChange("poison")],
        options: {
          transfer: false,
          durationSeconds: 60,
          description: "Loses any Resistance or Immunity to Poison damage and has Vulnerability to it for 1 minute.",
        },
      },
    ];
  }

}
