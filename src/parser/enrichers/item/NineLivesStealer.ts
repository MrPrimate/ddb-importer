import DDBEnricherData from "../data/DDBEnricherData";
import { itemUses } from "./_ItemActivities";

/**
 * Life Stealing spends one of the sword's charges (1d8 + 1, never regained, so the most it can
 * start with) only when the creature is slain, so the save is the activity that spends it.
 */
export default class NineLivesStealer extends DDBEnricherData {

  get #isWeapon(): boolean {
    return this.data.type === "weapon";
  }

  #lifeStealing(): IDDBActivityData {
    return {
      name: "Life Stealing",
      activationType: "special",
      activationCondition: "You roll a 20 on an attack against a creature with fewer than 100 Hit Points",
      overrideActivation: true,
      addItemConsume: true,
      data: {
        target: { override: true, affects: { type: "creature", count: "1", choice: false, special: "" } },
      },
    };
  }

  // a generic root record's own activity is the text's DC 15 Constitution save; a sword's is its
  // attack, so the save is built beside it (replacing the parser's text save)
  override get activity(): IDDBActivityData | null {
    return this.#isWeapon ? null : this.#lifeStealing();
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    if (!this.#isWeapon) return [];
    return [
      {
        init: { name: "Life Stealing", type: DDBEnricherData.ACTIVITY_TYPES.SAVE },
        build: {
          generateActivation: true,
          generateConsumption: false,
          generateSave: true,
          saveOverride: { ability: ["con"], dc: { calculation: "", formula: "15" } },
          generateTarget: true,
        },
        overrides: this.#lifeStealing(),
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Life Stolen",
        statuses: ["Dead"],
        activityMatch: "Life Stealing",
        options: { transfer: false, durationSeconds: null },
      },
    ];
  }

  override get override(): IDDBOverrideData {
    return itemUses(this, "9");
  }

}
