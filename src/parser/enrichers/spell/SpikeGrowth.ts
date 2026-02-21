import DDBEnricherData from "../data/DDBEnricherData";

export default class SpikeGrowth extends DDBEnricherData {
  get type() {
    return "utility";
  }

  get activity() {
    return {
      name: "Place Template",
    };
  }

  get additionalActivities() {
    return [
      {
        constructor: {
          name: "Movement Damage",
          type: "damage",
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
