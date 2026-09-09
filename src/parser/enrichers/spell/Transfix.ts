import DDBEnricherData from "../data/DDBEnricherData";

export default class Transfix extends DDBEnricherData {

  override get clearAutoEffects(): boolean {
    return true;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Charisma Save",
      targetType: "creature",
      noTemplate: true,
      data: {
        range: { value: "60", units: "ft" },
        damage: { parts: [] },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: { name: "Psychic Damage (Ends Turn Within 5 ft)", type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE },
        build: {
          generateDamage: true,
          generateActivation: true,
          generateConsumption: false,
          noSpellslot: true,
          damageParts: [DDBEnricherData.basicDamagePart({ number: 4, denomination: 8, type: "psychic", scalingMode: "none" })],
        },
        overrides: {
          targetType: "creature",
          activationType: "special",
          noTemplate: true,
        },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Transfixed",
        activityMatch: "Charisma Save",
        statuses: ["Charmed", "Incapacitated"],
        options: { durationSeconds: 60, description: "Moves toward the caster on its turn." },
      },
    ];
  }

}
