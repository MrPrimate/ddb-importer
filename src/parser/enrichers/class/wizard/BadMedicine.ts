import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Plague Doctor: DDB's Hurl Bad Medicine save stays; the dose's damaging effects get their own
 * activities, rolled as the poisoned creature acts or starts its turn. The acid effect deals the
 * slot level (scaling step = slot level - 1).
 */
export default class BadMedicine extends DDBEnricherData {

  static ongoing(name: string, part: I5eDamagePart, condition: string, scaling = false): IDDBAdditionalActivity {
    return {
      init: {
        name,
        type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE,
      },
      build: {
        generateConsumption: false,
        generateTarget: true,
        generateActivation: true,
        generateDamage: true,
        damageParts: [part],
        activationOverride: { type: "special", value: 1, condition },
      },
      overrides: scaling
        ? { data: { consumption: { targets: [], scaling: { allowed: true, max: "9" } } } }
        : {},
    };
  }

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.NONE;
  }

  override get useDefaultAdditionalActivities(): boolean {
    return true;
  }

  override get addToDefaultAdditionalActivities(): boolean {
    return true;
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      BadMedicine.ongoing(
        "Necrotic Dose",
        DDBEnricherData.basicDamagePart({ number: 1, denomination: 4, types: ["necrotic"] }),
        "The first time the creature takes damage each turn",
      ),
      BadMedicine.ongoing(
        "Poison Dose",
        DDBEnricherData.basicDamagePart({ number: 1, denomination: 6, types: ["poison"] }),
        "Each time the creature takes an action, Bonus Action or Reaction",
      ),
      BadMedicine.ongoing(
        "Acid Dose",
        DDBEnricherData.basicDamagePart({ customFormula: "1", types: ["acid"], scalingMode: "whole", scalingFormula: "1" }),
        "At the start of each of the creature's turns",
        true,
      ),
    ];
  }

}
