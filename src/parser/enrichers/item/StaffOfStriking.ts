import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Staff of Striking: spend up to 3 charges on a hit for 1d6 force per charge.
 */
export default class StaffOfStriking extends DDBEnricherData {
  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Charge Damage",
          type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE,
        },
        build: {
          generateDamage: true,
          generateActivation: true,
          generateTarget: true,
          generateRange: true,
          generateConsumption: true,
          activationOverride: { type: "special", value: null, condition: "When you hit with a melee attack using the staff" },
          damageParts: [DDBEnricherData.basicDamagePart({ customFormula: "(@scaling)d6", types: ["force"] })],
          targetOverride: { affects: { count: "1", type: "creature", choice: false, special: "" } },
        },
        overrides: {
          rangeSelf: true,
          addItemConsume: true,
          addScalingMode: "amount",
          addConsumptionScalingMax: "min(3, @item.uses.value)",
        },
      },
    ];
  }

}
