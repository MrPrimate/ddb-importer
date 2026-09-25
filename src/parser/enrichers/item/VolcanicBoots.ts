import DDBEnricherData from "../data/DDBEnricherData";
import { itemUses } from "./_ItemActivities";

/**
 * Each charge scorches one 5-foot cube the wearer just walked through, so one use places one cube
 * and spends one charge. The save is rolled by hand against any creature but the wearer that
 * enters a cube or starts its turn there. DDB carries no charges for the boots.
 */
export default class VolcanicBoots extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Scorch the Ground",
      targetType: "creature",
      activationType: "special",
      activationCondition: "Walk at least 5 feet on solid ground; one cube per charge",
      addItemConsume: true,
      noeffect: true,
      removeDamageParts: true,
      data: {
        target: {
          override: true,
          affects: { type: "creature" },
          template: { contiguous: false, units: "ft", type: "cube", size: "5" },
        },
        range: { override: true, value: null, units: "spec", special: "An unoccupied space you just walked through" },
        duration: { override: true, value: "1", units: "minute" },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: { name: "Volcanic Ground Save", type: DDBEnricherData.ACTIVITY_TYPES.SAVE },
        build: {
          generateSave: true,
          generateDamage: true,
          generateActivation: true,
          generateConsumption: false,
          generateTarget: true,
          generateRange: true,
          saveOverride: { ability: ["dex"], dc: { calculation: "", formula: "15" } },
          damageParts: [
            DDBEnricherData.basicDamagePart({ number: 2, denomination: 6, types: ["fire"] }),
          ],
          activationOverride: {
            type: "special",
            value: null,
            condition: "A creature other than the wearer enters a scorched cube or starts its turn there",
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
    ];
  }

  override get override(): IDDBOverrideData {
    return itemUses(this, "10", [{ period: "dawn", type: "formula", formula: "1d6 + 4" }]);
  }

}
