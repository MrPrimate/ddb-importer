import DDBEnricherData from "../data/DDBEnricherData";

/** 2014: 5d12 necrotic or 5d12 temp HP for Undead; AU 2024: 3d10 + 25 necrotic or 3d10 temp HP. */
export default class NegativeEnergyFlood extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return {
      stopHealSpellActivity: true,
      name: "Living Target",
      data: {
        damage: {
          onSave: "half",
          parts: [
            DDBEnricherData.basicDamagePart({
              number: this.is2014 ? 5 : 3,
              denomination: this.is2014 ? 12 : 10,
              bonus: this.is2014 ? "" : "25",
              type: "necrotic",
              scalingMode: "whole",
              scalingNumber: 1,
            }),
          ],
        },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Undead Target",
          type: DDBEnricherData.ACTIVITY_TYPES.HEAL,
        },
        build: {
          generateHealing: true,
          generateActivation: true,
          generateConsumption: true,
          generateRange: true,
          generateTarget: true,
          healingPart: DDBEnricherData.basicDamagePart({
            number: this.is2014 ? 5 : 3,
            denomination: this.is2014 ? 12 : 10,
            types: ["temphp"],
            scalingMode: "none",
          }),
        },
        overrides: {
          targetType: "creature",
          noTemplate: true,
        },
      },
    ];
  }

}
