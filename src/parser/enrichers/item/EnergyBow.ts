import DDBEnricherData from "../data/DDBEnricherData";
import { itemActivity, itemCheck } from "./_ItemActivities";

/**
 * Energy Bow: the transport and ladder utilities; the parser builds the restraint save.
 */
export default class EnergyBow extends DDBEnricherData {
  /** The per-bow copies are weapons whose attack is the primary; the plain item's primary is the save. */
  get #isWeaponCopy(): boolean {
    return this.data.type === "weapon";
  }

  /**
   * Arrow of Restraint and its escape. An enricher's own activities replace the parser's, so the
   * weapon copies build the restraint save and the escape check the parser gave them.
   */
  get #restraintActivities(): IDDBAdditionalActivity[] {
    if (!this.#isWeaponCopy) return [];
    return [
      itemActivity("Arrow of Restraint", DDBEnricherData.ACTIVITY_TYPES.SAVE, {
        targetType: "creature",
        noeffect: false,
        data: {
          save: { ability: ["str"], dc: { calculation: "", formula: "15" } },
        },
      }, {
        generateSave: true,
        activationOverride: { type: "special", value: null, condition: "The arrow of restraint hits a creature" },
        targetOverride: { affects: { type: "creature", count: "1", choice: false }, template: { type: "" } },
      }),
      itemCheck("Escape Check", {
        ability: "str",
        skill: "ath",
        dc: "20",
        condition: "A creature Restrained by an arrow",
      }),
    ];
  }

  override get clearAutoEffects(): boolean {
    return this.#isWeaponCopy;
  }

  override get effects(): IDDBEffectHint[] {
    if (!this.#isWeaponCopy) return [];
    return [
      {
        name: "Arrow of Restraint: Restrained",
        statuses: ["Restrained"],
        activityMatch: "Arrow of Restraint",
        options: { transfer: false, durationSeconds: 60 },
      },
    ];
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      ...this.#restraintActivities,
      {
        init: {
          name: "Arrow of Transport",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          generateActivation: true,
          generateTarget: true,
          generateRange: true,
          generateUtility: true,
          activationOverride: { type: "action", value: null, condition: "Teleport the target to an unoccupied space within 10 feet of the point where the arrow lands" },
          targetOverride: {
            affects: { count: "1", type: "creatureOrObject", choice: false, special: "" },
          },
        },
        overrides: {
          rangeType: "ft",
          rangeValue: 60,
          noTemplate: true,
        },
      },
      {
        init: {
          name: "Energy Ladder",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          generateActivation: true,
          generateTarget: true,
          generateRange: true,
          generateUtility: true,
          activationOverride: { type: "action", value: null, condition: "" },
          targetOverride: {
            template: { type: "wall", size: "3", width: "2", units: "ft", count: "" },
            affects: { count: "", type: "object", choice: false, special: "" },
          },
        },
        overrides: {
          rangeType: "ft",
          rangeValue: 60,
        },
      },
    ];
  }

}
