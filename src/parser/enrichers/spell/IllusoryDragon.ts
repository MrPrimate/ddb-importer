import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Casting summons the importer-built Illusory Dragon actor (see the IllusoryDragon
 * companion type and monster enrichers for the token's own actions). The two saves
 * are kept on the spell as well so the caster can roll them without the token:
 * the Frightened save on appearance and the bonus-action breath.
 */
export default class IllusoryDragon extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.SUMMON;
  }

  override get summonsFunction(): ((data: ICompanionData) => Promise<ICompanionResult>) | null {
    return DDBImporter.lib.DDBSummonsInterface.getIllusoryDragon;
  }

  override get generateSummons(): boolean {
    return true;
  }

  override get addAutoAdditionalActivities(): boolean {
    return false;
  }

  override get clearAutoEffects(): boolean {
    return true;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Summon Dragon",
      type: DDBEnricherData.ACTIVITY_TYPES.SUMMON,
      noTemplate: true,
      profileKeys: [
        { count: 1, name: this.is2014 ? "IllusoryDragon2014" : "IllusoryDragon2024" },
      ],
      summons: {
        match: {
          proficiency: true,
          attacks: false,
          saves: true,
        },
      },
      data: {
        creatureSizes: ["huge"],
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Frightful Appearance (Wisdom Save)",
          type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
        },
        build: {
          generateSave: true,
          generateDamage: false,
          generateActivation: true,
          generateConsumption: false,
          generateRange: true,
          generateTarget: true,
          noSpellslot: true,
          saveOverride: { ability: ["wis"], dc: { calculation: "spellcasting", formula: "" } },
        },
        overrides: {
          activationType: "special",
          activationCondition: "When the dragon appears, any enemy that can see it",
          targetType: "enemy",
          noTemplate: true,
          data: { range: { units: "spec" } },
        },
      },
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
        activityMatch: "Frightful Appearance (Wisdom Save)",
        statuses: ["Frightened"],
        options: { durationSeconds: 60 },
      },
    ];
  }

  override get override(): IDDBOverrideData {
    return {
      data: {
        flags: {
          ddbimporter: {
            disposition: {
              match: true,
            },
          },
        },
      },
    };
  }

}
