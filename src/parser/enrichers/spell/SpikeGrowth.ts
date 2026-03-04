import DDBEnricherData from "../data/DDBEnricherData";

export default class SpikeGrowth extends DDBEnricherData {
  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity() {
    return {
      name: "Place Template",
    };
  }

  get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Movement Damage",
          type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE,
        },
        build: {
          generateDamage: true,
          generateSave: false,
          generateConsumption: false,
          noSpellslot: true,
          onsave: false,
          noeffect: true,
          activationOverride: { type: "", condition: "Moves 5ft" },
          damageParts: [
            DDBEnricherData.basicDamagePart({
              number: 2,
              denomination: 4,
              type: "piercing",
            }),
          ],
        },
      },
    ];
  }
}
