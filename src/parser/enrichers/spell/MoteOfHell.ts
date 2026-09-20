import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Nothing is rolled as the spell is cast. DDB records the 30 feet the screams carry as the area;
 * the cloud itself is a 15-foot-radius sphere. Inside it is difficult terrain and blinding, fire
 * burns a creature that starts its turn there with no save, and one that ends its turn there
 * saves against the psychic damage. Each is a free roll made by hand and takes its own DDB damage
 * part. The cast carries the Blinded effect, which is removed by hand from a creature that leaves.
 */
export default class MoteOfHell extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Cast",
      removeDamageParts: true,
      data: {
        target: {
          override: true,
          affects: { type: "creature" },
          template: { contiguous: false, units: "ft", type: "sphere", size: "15", count: "1" },
        },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: { name: "Hellfire Damage", type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE },
        build: {
          generateDuration: true,
          durationOverride: {
            units: "inst",
            concentration: false,
          },
          generateActivation: true,
          generateConsumption: false,
          generateTarget: true,
          generateSave: false,
          generateDamage: true,
          partialDamageParts: [0],
          noSpellslot: true,
          activationOverride: {
            type: "special",
            value: null,
            condition: "Starts its turn in the cloud",
          },
          targetOverride: { override: true, affects: { count: "1", type: "creature" }, template: {} },
        },
        overrides: {
          data: { range: { override: true, units: "spec" } },
        },
      },
      {
        init: { name: "Voices of the Damned Save", type: DDBEnricherData.ACTIVITY_TYPES.SAVE },
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
          generateDamage: true,
          partialDamageParts: [1],
          noSpellslot: true,
          activationOverride: {
            type: "special",
            value: null,
            condition: "Ends its turn in the cloud",
          },
          targetOverride: { override: true, affects: { count: "1", type: "creature" }, template: {} },
        },
        overrides: {
          data: { range: { override: true, units: "spec" } },
        },
      },
    ];
  }

  // the parsed Blinded effect would ride on the save; the cast carries it instead
  override get clearAutoEffects(): boolean {
    return true;
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Blinded",
        activityMatch: "Cast",
        statuses: ["Blinded"],
        // held only while inside the cloud and removed by hand on leaving, so it carries no expiry of its own
        options: {
          transfer: false,
          expiry: null,
          description: "Blinded while in the cloud. Remove when the creature leaves.",
        },
      },
    ];
  }

}
