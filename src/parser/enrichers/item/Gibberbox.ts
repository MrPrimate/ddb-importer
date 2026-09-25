import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Opening the lid rolls nothing: it marks a 20-foot emanation for 1 minute, once per 24 hours.
 * The save is its own activity, rolled by hand against any creature that starts its turn inside,
 * the holder included.
 */
export default class Gibberbox extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Open the Lid",
      targetType: "creature",
      activationType: "action",
      noeffect: true,
      removeDamageParts: true,
      data: {
        target: {
          override: true,
          affects: { type: "creature" },
          template: { contiguous: false, units: "ft", type: "radius", size: "20" },
        },
        range: { override: true, value: null, units: "self", special: "" },
        duration: { override: true, value: "1", units: "minute" },
        uses: { spent: 0, max: "1", recovery: [{ period: "day", type: "recoverAll" }] },
        consumption: {
          targets: [{ type: "activityUses", target: "", value: "1", scaling: { mode: "", formula: "" } }],
          scaling: { allowed: false, max: "" },
        },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: { name: "Babbling Save", type: DDBEnricherData.ACTIVITY_TYPES.SAVE },
        build: {
          generateSave: true,
          generateDamage: false,
          generateActivation: true,
          generateConsumption: false,
          generateTarget: true,
          generateRange: true,
          saveOverride: { ability: ["wis"], dc: { calculation: "", formula: "10" } },
          activationOverride: {
            type: "special",
            value: null,
            condition: "Starts its turn within 20 feet of the open box and can hear it",
          },
          targetOverride: { override: true, affects: { count: "1", type: "creature" }, template: {} },
          rangeOverride: { override: true, value: null, units: "self", special: "" },
        },
        overrides: {
          noConsumeTargets: true,
          noTemplate: true,
          data: { damage: { onSave: "none" } },
        },
      },
      {
        init: { name: "Babbling Behavior", type: DDBEnricherData.ACTIVITY_TYPES.UTILITY },
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
            condition: "Failed the Babbling Save: 1-4 does nothing, 5-6 moves in a random direction, 7-8 makes a melee attack against a random creature in reach",
          },
          targetOverride: { override: true, affects: { count: "1", type: "creature" }, template: {} },
          rangeOverride: { override: true, value: null, units: "self", special: "" },
        },
        overrides: {
          noConsumeTargets: true,
          noTemplate: true,
          data: { roll: { prompt: false, visible: false, name: "Babbling Behavior", formula: "1d8" } },
        },
      },
      {
        init: { name: "Touch the Paste", type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE },
        build: {
          generateSave: false,
          generateDamage: true,
          generateActivation: true,
          generateConsumption: false,
          generateTarget: true,
          generateRange: true,
          damageParts: [
            DDBEnricherData.basicDamagePart({ number: 1, denomination: 6, types: ["piercing"] }),
          ],
          activationOverride: {
            type: "special",
            value: null,
            condition: "Touches the paste and mouth while the box is open and babbling",
          },
          targetOverride: { override: true, affects: { count: "1", type: "creature" }, template: {} },
          rangeOverride: { override: true, value: null, units: "self", special: "" },
        },
        overrides: { noConsumeTargets: true, noTemplate: true },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Gibberbox: Babbling",
        activityMatch: "Babbling Save",
        options: {
          transfer: false,
          expiry: "targetStart",
          durationRounds: 1,
          durationSeconds: 6,
          description: "Can't make Opportunity Attacks until the start of its next turn, and its current turn is decided by the Babbling Behavior roll.",
        },
      },
    ];
  }

}
