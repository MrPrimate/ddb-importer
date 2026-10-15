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
        changes: [
          DDBEnricherData.ChangeHelper.upgradeChange("30", 20, "token.light.bright"),
          DDBEnricherData.ChangeHelper.upgradeChange("30", 20, "token.light.dim"),
          DDBEnricherData.ChangeHelper.overrideChange("#fff4d6", 20, "token.light.color"),
          DDBEnricherData.ChangeHelper.overrideChange("0.25", 20, "token.light.alpha"),
        ],
      },
    ];
  }

}
