import DDBEnricherData from "../data/DDBEnricherData";

/** The Frightened save on appearance is the cast; the breath is a bonus-action Intelligence save. */
export default class IllusoryDragon extends DDBEnricherData {

  override get addAutoAdditionalActivities(): boolean {
    return false;
  }

  override get clearAutoEffects(): boolean {
    return true;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Cast (Wisdom Save vs Frightened)",
      targetType: "enemy",
      noTemplate: true,
      data: {
        save: { ability: ["wis"], dc: { calculation: "spellcasting", formula: "" } },
        damage: { parts: [] },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Breath (Intelligence Save)",
          type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
        },
        build: {
          generateSave: true,
          generateDamage: true,
          generateActivation: true,
          generateConsumption: false,
          generateRange: true,
          generateTarget: true,
          noSpellslot: true,
          saveOverride: { ability: ["int"], dc: { calculation: "spellcasting", formula: "" } },
          onSave: "half",
          damageParts: [
            DDBEnricherData.basicDamagePart({
              number: this.is2014 ? 7 : 6,
              denomination: 6,
              types: ["acid", "cold", "fire", "lightning", "necrotic", "poison"],
              scalingMode: "none",
            }),
          ],
          targetOverride: {
            affects: { type: "creature" },
            template: { type: "cone", size: "60", units: "ft" },
          },
        },
        overrides: {
          activationType: "bonus",
          targetType: "creature",
          data: { range: { units: "spec" } },
        },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Frightened by Illusory Dragon",
        activityMatch: "Cast (Wisdom Save vs Frightened)",
        statuses: ["Frightened"],
        options: { durationSeconds: 60 },
      },
    ];
  }

}
