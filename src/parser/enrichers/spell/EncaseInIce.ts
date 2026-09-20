import DDBEnricherData from "../data/DDBEnricherData";

/**
 * The wave rolls its save as it freezes, restraining those it catches. The ice then stays as
 * difficult terrain and calls for a second, different save, against falling Prone, from a creature
 * that enters it or ends its turn there, a free roll made by hand. The rules spare creatures
 * caught at the cast from the terrain, and creatures already Restrained from the second save;
 * both are left to the table. DDB gives the spell no template.
 */
export default class EncaseInIce extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return {
      name: "Cast",
      data: {
        target: {
          override: true,
          affects: { type: "creature" },
          template: { contiguous: false, units: "ft", type: "square", size: "20", count: "1" },
        },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: { name: "Slip Save", type: DDBEnricherData.ACTIVITY_TYPES.SAVE },
        build: {
          generateActivation: true,
          generateConsumption: false,
          generateTarget: true,
          generateSave: true,
          generateDamage: false,
          noSpellslot: true,
          activationOverride: {
            type: "special",
            value: null,
            condition: "A creature not Restrained by the ice enters it or ends its turn there",
          },
          targetOverride: { override: true, affects: { count: "1", type: "creature" }, template: {} },
        },
        overrides: {
          data: { range: { override: true, units: "spec" } },
        },
      },
      {
        init: { name: "Break Free", type: DDBEnricherData.ACTIVITY_TYPES.CHECK },
        build: {
          generateCheck: true,
          generateTarget: false,
          generateRange: false,
          generateConsumption: false,
          noSpellslot: true,
          checkOverride: { ability: "", associated: ["ath"], dc: { calculation: "spellcasting", formula: "" } },
        },
        overrides: { noeffect: true, noTemplate: true, activationType: "action" },
      },
    ];
  }

  override get clearAutoEffects(): boolean {
    return true;
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Restrained",
        activityMatch: "Cast",
        statuses: ["Restrained"],
        options: { transfer: false, description: "Legs trapped in the ice until the spell ends or a Strength (Athletics) check against the spell save DC frees it." },
      },
      {
        name: "Prone",
        activityMatch: "Slip Save",
        statuses: ["Prone"],
        options: { transfer: false },
      },
    ];
  }

}
