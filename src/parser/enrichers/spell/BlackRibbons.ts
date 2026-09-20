import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Nothing is rolled as the spell is cast: the ribbons are difficult terrain and catch a creature
 * that ends its turn among them, a free roll made by hand. One success makes a creature immune to
 * being restrained again, which is left to the table.
 */
export default class BlackRibbons extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Cast",
      removeDamageParts: true,
      // what the area does to a creature belongs to the free roll, not to the cast
      noeffect: true,
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: { name: "Ongoing Save", type: DDBEnricherData.ACTIVITY_TYPES.SAVE },
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
            condition: "Ends its turn in the area; a creature that has saved once can't be restrained again",
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
          expiry: "targetEnd",
          durationRounds: 1,
          durationSeconds: 6,
          description: "Restrained by the ribbons until the end of its next turn.",
        },
      },
    ];
  }

}
