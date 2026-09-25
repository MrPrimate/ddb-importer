import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Nothing is rolled as the spell is cast. The shadows call for a Strength save from a creature
 * that enters them or starts its turn there. A creature that starts its turn already Restrained
 * makes a Constitution save against Exhaustion instead. Both are free rolls made by hand.
 */
export default class LivingShadows extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Cast",
      removeDamageParts: true,
      // what the shadows do to a creature belongs to the free rolls, not to the cast
      noeffect: true,
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: { name: "Ongoing Save", type: DDBEnricherData.ACTIVITY_TYPES.SAVE },
        build: {
          generateDuration: true,
          durationOverride: {
            units: "inst",
            concentration: false,
          },
          generateActivation: true,
          generateConsumption: false,
          generateTarget: true,
          generateSave: true,
          generateDamage: false,
          noSpellslot: true,
          activationOverride: {
            type: "special",
            value: null,
            condition: "Starts its turn in the shadows or enters them for the first time on its turn",
          },
          targetOverride: { override: true, affects: { count: "1", type: "creature" }, template: {} },
        },
        overrides: {
          data: { range: { override: true, units: "spec" } },
        },
      },
      {
        init: { name: "Exhaustion Save", type: DDBEnricherData.ACTIVITY_TYPES.SAVE },
        build: {
          generateDuration: true,
          durationOverride: {
            units: "inst",
            concentration: false,
          },
          generateActivation: true,
          generateConsumption: false,
          generateTarget: true,
          generateSave: true,
          generateDamage: false,
          saveOverride: { ability: ["con"], dc: { calculation: "spellcasting", formula: "" } },
          noSpellslot: true,
          activationOverride: {
            type: "special",
            value: null,
            condition: "Starts its turn Restrained by the shadows",
          },
          targetOverride: { override: true, affects: { count: "1", type: "creature" }, template: {} },
        },
        overrides: {
          data: { range: { override: true, units: "spec" } },
        },
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
        activityMatch: "Ongoing Save",
        statuses: ["Restrained"],
        options: {
          transfer: false,
          description: "Restrained by the shadows. A Strength or Dexterity check against the spell save DC, as an action, frees it.",
        },
      },
      {
        name: "Living Shadows: Exhaustion",
        activityMatch: "Exhaustion Save",
        options: { transfer: false, description: "Gains 1 Exhaustion level. Raise the Exhaustion level by hand." },
      },
    ];
  }

}
