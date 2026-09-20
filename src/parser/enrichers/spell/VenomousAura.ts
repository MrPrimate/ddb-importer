import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Nothing is rolled at all: a creature that starts its turn within 10 feet is Poisoned until its
 * next turn, even if it then leaves, so a free activity applies the effect by hand. DDB records
 * the area as a sphere, so it is restated as a 10-foot emanation on the caster.
 */
export default class VenomousAura extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Cast",
      removeDamageParts: true,
      // the poison belongs to the free activity, not to the cast
      noeffect: true,
      data: {
        target: {
          override: true,
          affects: { type: "creature" },
          template: { contiguous: false, units: "ft", type: "radius", size: "10", count: "1" },
        },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: { name: "Venomous Aura: Poison", type: DDBEnricherData.ACTIVITY_TYPES.UTILITY },
        build: {
          generateActivation: true,
          generateConsumption: false,
          generateTarget: true,
          generateSave: false,
          generateDamage: false,
          noSpellslot: true,
          activationOverride: {
            type: "special",
            value: null,
            condition: "Starts its turn within 10 feet of the caster",
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
        name: "Poisoned",
        activityMatch: "Venomous Aura: Poison",
        statuses: ["Poisoned"],
        options: {
          transfer: false,
          expiry: "targetStart",
          durationRounds: 1,
          durationSeconds: 6,
          description: "Poisoned until the start of its next turn.",
        },
      },
    ];
  }

}
