import DDBEnricherData from "../../data/DDBEnricherData";

export default class DeflectEnergy extends DDBEnricherData {
  override get type() {
    return DDBEnricherData.ACTIVITY_TYPES.NONE;
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      { action: { name: "Deflect Attack", type: "class" } },
      {
        action: { name: "Deflect Attack: Redirect Attack", type: "class" },
        overrides: { data: {
          damage: {
            // types: DDBEnricherData.allDamageTypes(),
          },
        } },
      },
    ];
  }

  override get override(): IDDBOverrideData {
    return {
      ignoredConsumptionActivities: ["Reduce Damage"],
    };
  }
}
