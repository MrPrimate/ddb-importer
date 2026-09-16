import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Thunderous Greatclub: Strength 20 while attuned, the Clap of Thunder cone and the once-per-dawn Earthquake.
 */
export default class ThunderousGreatclub extends DDBEnricherData {
  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Clap of Thunder",
          type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
        },
        build: {
          generateSave: true,
          generateActivation: true,
          generateTarget: true,
          generateRange: true,
          saveOverride: { ability: ["str"], dc: { calculation: "", formula: "15" } },
          activationOverride: { type: "action", value: null, condition: "Slam the club into the ground" },
          targetOverride: {
            template: { type: "cone", size: "30", width: "", units: "ft", count: "" },
            affects: { count: "", type: "creature", choice: false, special: "" },
          },
        },
        overrides: {
          rangeSelf: true,
        },
      },
      {
        init: {
          name: "Earthquake",
          type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
        },
        build: {
          generateSave: true,
          generateActivation: true,
          generateTarget: true,
          generateRange: true,
          generateConsumption: true,
          saveOverride: { ability: ["dex"], dc: { calculation: "", formula: "20" } },
          activationOverride: { type: "action", value: null, condition: "Once per day, 50-foot radius" },
          targetOverride: {
            template: { type: "radius", size: "50", width: "", units: "ft", count: "" },
            affects: { count: "", type: "creature", choice: false, special: "" },
          },
        },
        overrides: {
          rangeSelf: true,
          addItemConsume: true,
        },
      },
      {
        init: {
          name: "Earthquake: Concentration Save",
          type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
        },
        build: {
          generateSave: true,
          generateActivation: true,
          generateTarget: true,
          generateRange: true,
          saveOverride: { ability: ["con"], dc: { calculation: "", formula: "20" } },
          activationOverride: { type: "special", value: null, condition: "A creature in the Earthquake area that is concentrating" },
          targetOverride: {
            template: { type: "", size: "", width: "", units: "", count: "" },
            affects: { count: "1", type: "creature", choice: false, special: "" },
          },
        },
        overrides: {
          rangeSelf: true,
        },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Thunderous Strength",
        changes: [
          DDBEnricherData.ChangeHelper.upgradeChange("20", 20, "system.abilities.str.value"),
        ],
        options: {
          transfer: true,
        },
      },
    ];
  }

}
