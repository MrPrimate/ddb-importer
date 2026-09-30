import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Necromancer (AU 2024) level 10. Grave Resilience lowers Exhaustion by one level whenever Arcane
 * Recovery is used, as a companion utility spending one level of the `attributes.exhaustion`
 * attribute (dnd5e refuses it at level 0, where there is nothing to remove). Overwhelming
 * Necrosis, ignoring Necrotic Resistance, has no automation in core dnd5e.
 */
export default class GravePower extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.NONE;
  }

  override get useDefaultAdditionalActivities(): boolean {
    return false;
  }

  override get addAutoAdditionalActivities(): boolean {
    return false;
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Grave Resilience",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          generateActivation: true,
          generateConsumption: true,
          generateTarget: true,
          activationOverride: { type: "special", value: null, condition: "When you use Arcane Recovery" },
          consumptionOverride: {
            scaling: { allowed: false, max: "" },
            targets: [
              { type: "attribute", target: "attributes.exhaustion", value: "1", scaling: { mode: "", formula: "" } },
            ],
          },
        },
        overrides: {
          targetType: "self",
          noTemplate: true,
        },
      },
    ];
  }

}
