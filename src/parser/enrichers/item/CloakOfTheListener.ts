import DDBEnricherData from "../data/DDBEnricherData";
import { escapeCheck, regionPlacerData, regionTrigger } from "../data/RegionBuilders";

const DAILY: I5eSystemLimitedUses = { spent: 0, max: "1", recovery: [{ period: "dawn", type: "recoverAll" }] };

/**
 * Two effects, each usable once per dawn, so each activity keeps its own use. Ooze rolls nothing
 * when used: it places a 10-foot square for 1 minute whose region fires the save against a
 * creature that enters it or starts its turn there.
 */
export default class CloakOfTheListener extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return regionPlacerData("Ooze", {
      template: { type: "square", size: "10" },
      range: "30",
      duration: { value: "1", units: "minute" },
      uses: DAILY,
      behaviors: [
        DDBEnricherData.BehaviorHelper.activity({
          events: ["tokenEnter", "tokenTurnStart"],
          activityName: "Ooze Save",
        }),
      ],
    });
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      regionTrigger("Ooze Save", {
        condition: "Enters the wax or starts its turn there",
        save: { ability: ["dex"], dc: "15" },
      }),
      escapeCheck("15"),
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
