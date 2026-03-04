import DDBEnricherData from "../../data/DDBEnricherData";

export default class DeflectEnergy extends DDBEnricherData {
  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.NONE;
  }

  get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      { action: { name: "Deflect Attack", type: "class" } },
      {
        action: { name: "Deflect Attack: Redirect Attack", type: "class" },
        override: { data: {
          "damage.types": DDBEnricherData.allDamageTypes(),
        } },
      },
    ];
  }

  get override() {
    return {
      ignoredConsumptionActivities: ["Reduce Damage"],
    };
  }
}
