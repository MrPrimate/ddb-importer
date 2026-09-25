import DDBEnricherData from "../data/DDBEnricherData";

export default class SpikeGrowth extends DDBEnricherData {
  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Place Template",
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Movement Damage",
          type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE,
        },
        build: {
          generateDuration: true,
          durationOverride: { units: "inst", concentration: false },
          generateDamage: true,
          generateSave: false,
          generateConsumption: false,
          noSpellslot: true,
          onsave: false,
          noeffect: true,
          activationOverride: { type: "special", condition: "Moves 5ft" },
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
