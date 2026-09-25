import DDBEnricherData from "../data/DDBEnricherData";

const DAILY: I5eSystemLimitedUses = { spent: 0, max: "1", recovery: [{ period: "dawn", type: "recoverAll" }] };

/**
 * Two effects, each usable once per dawn, so each activity keeps its own use. Ooze rolls nothing
 * when used: it places a 10-foot square for 1 minute, and the save is its own activity rolled by
 * hand against a creature that enters it or starts its turn there.
 */
export default class CloakOfTheListener extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Ooze",
      targetType: "creature",
      activationType: "action",
      noeffect: true,
      removeDamageParts: true,
      data: {
        target: {
          override: true,
          affects: { type: "creature" },
          template: { contiguous: false, units: "ft", type: "square", size: "10" },
        },
        range: { override: true, value: "30", units: "ft" },
        duration: { override: true, value: "1", units: "minute" },
        uses: DAILY,
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
        init: { name: "Ooze Save", type: DDBEnricherData.ACTIVITY_TYPES.SAVE },
        build: {
          generateSave: true,
          generateDamage: false,
          generateActivation: true,
          generateConsumption: false,
          generateTarget: true,
          generateRange: true,
          saveOverride: { ability: ["dex"], dc: { calculation: "", formula: "15" } },
          activationOverride: {
            type: "special",
            value: null,
            condition: "Enters the wax or starts its turn there",
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
        init: { name: "Escape Check", type: DDBEnricherData.ACTIVITY_TYPES.CHECK },
        build: {
          generateTarget: false,
          generateRange: false,
          generateConsumption: false,
          generateCheck: true,
          checkOverride: { ability: "", associated: ["acr", "ath"], dc: { calculation: "", formula: "15" } },
        },
        overrides: { noConsumeTargets: true, noTemplate: true, noeffect: true },
      },
      {
        init: { name: "Hide", type: DDBEnricherData.ACTIVITY_TYPES.UTILITY },
        build: {
          generateActivation: true,
          generateTarget: true,
          generateRange: true,
          generateDuration: true,
          generateConsumption: false,
          activationOverride: { type: "action", value: null, condition: "" },
          targetOverride: { override: true, affects: { type: "self" }, template: {} },
          rangeOverride: { override: true, value: null, units: "self", special: "" },
          durationOverride: { override: true, value: "1", units: "minute" },
        },
        overrides: {
          noTemplate: true,
          data: {
            uses: DAILY,
            consumption: {
              targets: [{ type: "activityUses", target: "", value: "1", scaling: { mode: "", formula: "" } }],
              scaling: { allowed: false, max: "" },
            },
          },
        },
      },
    ];
  }

  override get clearAutoEffects(): boolean {
    return true;
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Grappled by Wax",
        activityMatch: "Ooze Save",
        statuses: ["Grappled"],
        options: { transfer: false, description: "Grappled (escape DC 15)." },
      },
      {
        name: "Cloak of the Listener: Hidden Head",
        activityMatch: "Hide",
        statuses: ["Blinded"],
        changes: [
          DDBEnricherData.ChangeHelper.upgradeChange("120", 20, "system.attributes.senses.ranges.blindsight"),
        ],
        options: {
          transfer: false,
          durationSeconds: 60,
          description: "Blinded, with Blindsight out to 120 feet, and you hear all speech within 120 feet regardless of obstructions.",
        },
      },
    ];
  }

}
