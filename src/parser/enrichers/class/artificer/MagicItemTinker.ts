import DDBEnricherData from "../../data/DDBEnricherData";
import Generic from "../Generic";

/**
 * 2024: three Replicate Magic Item options from DDB's actions. Drain Magic Item is once per long
 * rest and creates a level 1 or 2 spell slot (scaling picks the level); Transmute is once per long
 * rest. The feature itself has no uses.
 */
export default class MagicItemTinker extends Generic {

  static oncePerLongRest(): IDDBActivityData["data"] {
    return {
      uses: {
        spent: 0,
        max: "1",
        recovery: [{ period: "lr", type: "recoverAll" }],
      },
    };
  }

  get type(): IDDBActivityType | null {
    return this.is2014 ? null : DDBEnricherData.ACTIVITY_TYPES.NONE;
  }

  get useDefaultAdditionalActivities(): boolean {
    return this.is2014;
  }

  get additionalActivities(): IDDBAdditionalActivity[] {
    if (this.is2014) return [];
    return [
      { action: { name: "Charge Magic Item", type: "class" } },
      {
        action: { name: "Drain Magic Item", type: "class" },
        overrides: {
          noConsumeTargets: true,
          addActivityConsume: true,
          additionalConsumptionTargets: [
            {
              type: "spellSlots",
              target: "1",
              value: "-1",
              scaling: { mode: "level", formula: "" },
            },
          ],
          data: {
            ...MagicItemTinker.oncePerLongRest(),
            consumption: {
              scaling: { allowed: true, max: "2" },
            },
          },
        },
      },
      {
        action: { name: "Transmute Magic Item", type: "class" },
        overrides: {
          data: MagicItemTinker.oncePerLongRest(),
        },
      },
    ];
  }

  get override(): IDDBOverrideData {
    if (this.is2014) return null;
    return {
      uses: {
        max: "",
        spent: null,
        recovery: [],
      },
    };
  }

}
