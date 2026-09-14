import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Rod of Lordly Might: the three button weapons and the three once-per-dawn saves, with the Paralyzed and Frightened riders.
 */
export default class RodOfLordlyMight extends DDBEnricherData {
  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Button 1: Flame Tongue",
          type: DDBEnricherData.ACTIVITY_TYPES.ATTACK,
        },
        build: {
          generateAttack: true,
          generateDamage: true,
          generateActivation: true,
          generateTarget: true,
          generateRange: true,
          activationOverride: { type: "action", value: null, condition: "Longsword form" },
          targetOverride: {
            affects: { count: "1", type: "creature", choice: false, special: "" },
          },
        },
        overrides: {
          rangeType: "ft",
          rangeValue: 5,
          noeffect: true,
          data: { attack: {  }, damage: { includeBase: false, parts: [DDBEnricherData.basicDamagePart({ number: 2, denomination: 6, types: ["fire"] })] } },
        },
      },
      {
        init: {
          name: "Button 2: Battleaxe",
          type: DDBEnricherData.ACTIVITY_TYPES.ATTACK,
        },
        build: {
          generateAttack: true,
          generateDamage: true,
          generateActivation: true,
          generateTarget: true,
          generateRange: true,
          activationOverride: { type: "action", value: null, condition: "" },
          targetOverride: {
            affects: { count: "1", type: "creature", choice: false, special: "" },
          },
        },
        overrides: {
          rangeType: "ft",
          rangeValue: 5,
          noeffect: true,
          data: { attack: {  }, damage: { includeBase: false, parts: [DDBEnricherData.basicDamagePart({ number: 1, denomination: 8, types: ["slashing"] })] } },
        },
      },
      {
        init: {
          name: "Button 3: Spear",
          type: DDBEnricherData.ACTIVITY_TYPES.ATTACK,
        },
        build: {
          generateAttack: true,
          generateDamage: true,
          generateActivation: true,
          generateTarget: true,
          generateRange: true,
          activationOverride: { type: "action", value: null, condition: "" },
          targetOverride: {
            affects: { count: "1", type: "creature", choice: false, special: "" },
          },
        },
        overrides: {
          rangeType: "ft",
          rangeValue: 60,
          noeffect: true,
          data: { attack: {  }, damage: { includeBase: false, parts: [DDBEnricherData.basicDamagePart({ number: 1, denomination: 8, types: ["piercing"] })] } },
        },
      },
      {
        init: {
          name: "Paralyze",
          type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
        },
        build: {
          generateSave: true,
          generateActivation: true,
          generateTarget: true,
          generateRange: true,
          saveOverride: { ability: ["con"], dc: { calculation: "", formula: "17" } },
          activationOverride: { type: "action", value: null, condition: "On a hit with the rod, once per day" },
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
          name: "Terrify",
          type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
        },
        build: {
          generateSave: true,
          generateActivation: true,
          generateTarget: true,
          generateRange: true,
          saveOverride: { ability: ["wis"], dc: { calculation: "", formula: "17" } },
          activationOverride: { type: "action", value: null, condition: "Once per day" },
          targetOverride: {
            template: { type: "radius", size: "30", width: "", units: "ft", count: "" },
            affects: { count: "", type: "creature", choice: false, special: "" },
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
        name: "Paralyzed",
        activityMatch: "Paralyze",
        statuses: ["Paralyzed"],
        options: {
          durationSeconds: 60,
        },
      },
      {
        name: "Frightened",
        activityMatch: "Terrify",
        statuses: ["Frightened"],
        options: {
          durationSeconds: 60,
        },
      },
    ];
  }

}
