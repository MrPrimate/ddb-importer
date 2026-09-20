import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Nothing is rolled as the spell is cast. DDB records the area as a sphere, so it is restated as a
 * 10-foot emanation on the caster, and the save a creature makes when it moves within 10 feet or
 * starts its turn there is a free roll made by hand.
 */
export default class BlindingRadiance extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Cast",
      removeDamageParts: true,
      // what the area does to a creature belongs to the free roll, not to the cast
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
        init: { name: "Ongoing Save", type: DDBEnricherData.ACTIVITY_TYPES.SAVE },
        build: {
          generateActivation: true,
          generateConsumption: false,
          generateTarget: true,
          generateSave: true,
          generateDamage: true,
          noSpellslot: true,
          activationOverride: {
            type: "special",
            value: null,
            condition: "Moves within 10 feet of the caster for the first time on its turn or starts its turn there",
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
        name: "Blinded",
        activityMatch: "Ongoing Save",
        statuses: ["Blinded"],
        options: {
          transfer: false,
          expiry: "targetStart",
          durationRounds: 1,
          durationSeconds: 6,
          description: "Blinded until the start of its next turn.",
        },
      },
    ];
  }

}
