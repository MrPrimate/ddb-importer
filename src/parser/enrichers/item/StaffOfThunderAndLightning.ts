import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Staff of Thunder and Lightning: the five once-per-dawn properties as their own saves and damage rolls, with the Stunned and Deafened riders.
 */
export default class StaffOfThunderAndLightning extends DDBEnricherData {
  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Thunder",
          type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
        },
        build: {
          generateSave: true,
          generateActivation: true,
          generateTarget: true,
          generateRange: true,
          saveOverride: { ability: ["con"], dc: { calculation: "", formula: "17" } },
          activationOverride: { type: "action", value: null, condition: "On a hit, once per day; the target is Stunned until the end of your next turn" },
          targetOverride: {
            affects: { count: "1", type: "creature", choice: false, special: "" },
          },
        },
        overrides: {
          rangeSelf: true,
        },
      },
      {
        init: {
          name: "Lightning",
          type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE,
        },
        build: {
          generateDamage: true,
          generateActivation: true,
          generateTarget: true,
          generateRange: true,
          activationOverride: { type: "special", value: null, condition: "On a hit, once per day" },
          damageParts: [DDBEnricherData.basicDamagePart({ number: 2, denomination: 6, types: ["lightning"] })],
          targetOverride: {
            affects: { count: "1", type: "creature", choice: false, special: "" },
          },
        },
        overrides: {
          rangeSelf: true,
        },
      },
      {
        init: {
          name: "Thunder & Lightning",
          type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
        },
        build: {
          generateSave: true,
          generateActivation: true,
          generateTarget: true,
          generateRange: true,
          generateDamage: true,
          saveOverride: { ability: ["con"], dc: { calculation: "", formula: "17" } },
          activationOverride: { type: "action", value: null, condition: "On a hit, once per day; both effects" },
          damageParts: [DDBEnricherData.basicDamagePart({ number: 2, denomination: 6, types: ["lightning"] })],
          targetOverride: {
            affects: { count: "1", type: "creature", choice: false, special: "" },
          },
        },
        overrides: {
          rangeSelf: true,
          data: { damage: { onSave: "full" } },
        },
      },
      {
        init: {
          name: "Lightning Strike",
          type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
        },
        build: {
          generateSave: true,
          generateActivation: true,
          generateTarget: true,
          generateRange: true,
          generateDamage: true,
          saveOverride: { ability: ["dex"], dc: { calculation: "", formula: "17" } },
          activationOverride: { type: "action", value: null, condition: "Once per day" },
          damageParts: [DDBEnricherData.basicDamagePart({ number: 9, denomination: 6, types: ["lightning"] })],
          targetOverride: {
            template: { type: "line", size: "120", width: "5", units: "ft", count: "" },
            affects: { count: "", type: "creature", choice: false, special: "" },
          },
        },
        overrides: {
          rangeSelf: true,
          data: { damage: { onSave: "half" } },
        },
      },
      {
        init: {
          name: "Thunderclap",
          type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
        },
        build: {
          generateSave: true,
          generateActivation: true,
          generateTarget: true,
          generateRange: true,
          generateDamage: true,
          saveOverride: { ability: ["con"], dc: { calculation: "", formula: "17" } },
          activationOverride: { type: "action", value: null, condition: "Once per day" },
          damageParts: [DDBEnricherData.basicDamagePart({ number: 2, denomination: 6, types: ["thunder"] })],
          targetOverride: {
            template: { type: "radius", size: "60", width: "", units: "ft", count: "" },
            affects: { count: "", type: "creature", choice: false, special: "" },
          },
        },
        overrides: {
          rangeSelf: true,
          data: { damage: { onSave: "half" } },
        },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Deafened",
        activityMatch: "Thunderclap",
        statuses: ["Deafened"],
        options: {
          transfer: false,
          durationSeconds: 60,
        },
      },
    ];
  }

}
