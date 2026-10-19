import DDBEnricherData from "../data/DDBEnricherData";

export default class BoonOfTheBrightSun extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Daylight Presence",
      activationType: "bonus",
      data: {
        duration: { override: true, units: "perm" },
        // the light is on you; the area marks where it dispels spell Darkness
        target: {
          override: true,
          affects: { type: "self", count: "", choice: false, special: "" },
          template: { count: "1", contiguous: false, type: "radius", size: "30", units: "ft" },
        },
      },
    };
  }

  // the 10 temporary hit points land at the start of each of your turns while the light is active
  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: { name: "Fortifying Light", type: DDBEnricherData.ACTIVITY_TYPES.HEAL },
        build: {
          generateActivation: true,
          activationOverride: { type: "turnStart", value: null, condition: "While Daylight Presence is active" },
          generateConsumption: false,
          generateHealing: true,
          healingPart: DDBEnricherData.basicDamagePart({ customFormula: "10", types: ["temphp"] }),
          generateRange: true,
          rangeOverride: { units: "self" },
          generateTarget: true,
          targetOverride: {
            affects: { type: "ally", choice: true },
            template: { count: "1", contiguous: false, type: "radius", size: "30", units: "ft" },
          },
          noeffect: true,
        },
      },
    ];
  }

  // a 30-foot Emanation of Bright Light that is sunlight
  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Daylight Presence",
        activityMatch: "Daylight Presence",
        atlChanges: [
          DDBEnricherData.ChangeHelper.atlChange("ATL.light.bright", CONST.ACTIVE_EFFECT_MODES.UPGRADE, "30"),
          DDBEnricherData.ChangeHelper.atlChange("ATL.light.dim", CONST.ACTIVE_EFFECT_MODES.UPGRADE, "30"),
          DDBEnricherData.ChangeHelper.atlChange("ATL.light.color", CONST.ACTIVE_EFFECT_MODES.OVERRIDE, "#fff4d6"),
          DDBEnricherData.ChangeHelper.atlChange("ATL.light.alpha", CONST.ACTIVE_EFFECT_MODES.OVERRIDE, "0.25"),
        ],
      },
    ];
  }

}
