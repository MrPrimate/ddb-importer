import DDBEnricherData from "../../data/DDBEnricherData";

export default class DeflectAttacks extends DDBEnricherData {

  get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      { action: { name: "Deflect Attack", type: "class" } },
      {
        action: { name: "Deflect Attack: Redirect Attack", type: "class" },
        overrides: {
          data: {
            damage: {
              onSave: "none",
            },
          },
        },
      },
    ];
  }

  get override(): IDDBOverrideData {
    return {
      ignoredConsumptionActivities: ["Reduce Damage"],
      data: {
        flags: {
          ddbimporter: {
            skipScale: true,
          },
        },
      },
    };
  }

}
