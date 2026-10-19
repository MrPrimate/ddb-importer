import DDBEnricherData from "../data/DDBEnricherData";
import type DDBItem from "../../item/DDBItem";

/**
 * Protective Aura: the planted rod lights a 60-foot radius for 10 minutes, giving the wielder and
 * allies in its bright light +1 to AC and saving throws, once per dawn. The spells arrive as cast
 * activities from DDB's item spells and the Alertness advantage from DDB's modifiers.
 */
export default class RodOfAlertness extends DDBEnricherData {

  // some records give the rod itself the once-per-dawn use, which is the aura's; the parser's
  // plain "Use" activity for it would otherwise sit beside the aura
  get #itemCarriesUse(): boolean {
    return Boolean((this.ddbParser as DDBItem).ddbItem?.limitedUse);
  }

  override get stopDefaultActivity(): boolean {
    return true;
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    const ownUse: Partial<IDDBActivityBuild> = this.#itemCarriesUse
      ? { generateConsumption: false }
      : {
        generateUses: true,
        usesOverride: { spent: 0, max: "1", recovery: [{ period: "dawn", type: "recoverAll", formula: "" }] },
        generateConsumption: true,
        consumptionOverride: {
          targets: [{ type: "activityUses", target: "", value: "1", scaling: { mode: "", formula: "" } }],
          scaling: { allowed: false, max: "" },
        },
      };
    return [
      {
        init: { name: "Protective Aura", type: DDBEnricherData.ACTIVITY_TYPES.UTILITY },
        overrides: this.#itemCarriesUse ? { addItemConsume: true } : {},
        build: {
          generateActivation: true,
          activationOverride: { type: "action", value: 1, condition: "" },
          generateDuration: true,
          durationOverride: { value: "10", units: "minute" },
          generateRange: true,
          rangeOverride: { units: "self" },
          generateTarget: true,
          targetOverride: {
            affects: { type: "ally", choice: false },
            template: { count: "1", contiguous: false, type: "radius", size: "60", units: "ft" },
          },
          ...ownUse,
        },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Protective Aura",
        activityMatch: "Protective Aura",
        options: {
          transfer: false,
          durationSeconds: 600,
          description: "While in the rod's bright light; you can sense the location of any Invisible creature also in it.",
        },
        changes: [
          DDBEnricherData.ChangeHelper.addChange("1", 20, "system.attributes.ac.bonus"),
          DDBEnricherData.ChangeHelper.signedAddChange("1", 20, "system.bonuses.abilities.save"),
        ],
      },
    ];
  }

  override get override(): IDDBOverrideData {
    return {
      // the aura's once-per-dawn use lives on the activity when the rod carries none
      retainActivityUseSpent: true,
    };
  }

}
