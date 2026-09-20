import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Decanter of Endless Water: the Geyser command word is a 30-foot line with a DC 13 Strength save; splash and fountain are utilities.
 */
export default class DecanterOfEndlessWater extends DDBEnricherData {
  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Splash",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          generateActivation: true,
          generateTarget: true,
          generateRange: true,
          generateUtility: true,
          activationOverride: { type: "action", value: null, condition: "Produces 1 gallon of water" },
          targetOverride: {
            affects: { count: "1", type: "object", choice: false, special: "" },
          },
        },
        overrides: {
          rangeSelf: true,
          noTemplate: true,
        },
      },
      {
        init: {
          name: "Fountain",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          generateActivation: true,
          generateTarget: true,
          generateRange: true,
          generateUtility: true,
          activationOverride: { type: "action", value: null, condition: "Produces 5 gallons of water" },
          targetOverride: {
            affects: { count: "1", type: "object", choice: false, special: "" },
          },
        },
        overrides: {
          rangeSelf: true,
          noTemplate: true,
        },
      },
      {
        init: {
          name: "Geyser",
          type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
        },
        build: {
          generateSave: true,
          generateActivation: true,
          generateTarget: true,
          generateRange: true,
          generateDamage: true,
          saveOverride: { ability: ["str"], dc: { calculation: "", formula: "13" } },
          activationOverride: { type: "action", value: null, condition: "Produces 30 gallons in a 30-foot line" },
          damageParts: [DDBEnricherData.basicDamagePart({ number: 1, denomination: 4, types: ["bludgeoning"] })],
          targetOverride: {
            template: { type: "line", size: "30", width: "1", units: "ft", count: "" },
            affects: { count: "1", type: "creatureOrObject", choice: false, special: "" },
          },
        },
        overrides: {
          rangeSelf: true,
          data: { damage: { onSave: "none" } },
        },
      },
    ];
  }

}
