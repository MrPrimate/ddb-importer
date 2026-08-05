import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Infernal Conduit is a pool of d10s (Infernal Conduit Dice scale, long rest
 * recovery) spent to transfer HP by touch or drain a target.
 */
export default class InfernalConduit extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  get activity(): IDDBActivityData {
    return {
      name: "Transfer HP",
      targetType: "creature",
      targetCount: 1,
      activationType: "action",
      addItemConsume: true,
      addScalingMode: "amount",
      addConsumptionScalingMax: "@scale.illrigger.infernal-conduit",
      data: {
        range: {
          units: "touch",
        },
        healing: DDBEnricherData.basicDamagePart({
          number: 1,
          denomination: 10,
          types: ["healing"],
        }),
      },
    };
  }

  get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Drain",
          type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
        },
        build: {
          generateConsumption: true,
          generateTarget: true,
          generateRange: false,
          generateActivation: true,
          generateSave: true,
          generateDamage: true,
          activationOverride: {
            type: "action",
            value: 1,
            condition: "",
          },
          damageParts: [
            DDBEnricherData.basicDamagePart({
              number: 1,
              denomination: 10,
              types: ["necrotic"],
            }),
          ],
          saveOverride: {
            ability: ["con"],
            dc: { calculation: "cha", formula: "" },
          },
          consumptionOverride: {
            targets: [
              {
                type: "itemUses",
                target: "",
                value: 1,
                scaling: { mode: "amount", formula: "" },
              },
            ],
            scaling: { allowed: true, max: "@scale.illrigger.infernal-conduit" },
          },
        },
      },
    ];
  }

  get override(): IDDBOverrideData {
    return {
      data: {
        system: {
          uses: {
            spent: 0,
            max: "@scale.illrigger.infernal-conduit",
            recovery: [{ period: "lr", type: "recoverAll" }],
          },
        },
      },
    };
  }

}
